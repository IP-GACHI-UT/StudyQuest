# PostgreSQLバックアップ・復元手順

STEP 04の復元手順の正本。ローカルのダミーデータを別DBへ復元して照合した。[確認記録](progress/review/step04.md)。本番の定期取得はまだ設定していない。

## 運用方針（公開前に確定）

| 項目 | β向けの案 |
| --- | --- |
| 取得周期 | 毎日1回、DB変更直前にも取得 |
| 保持期間 | 日次7世代・週次4世代、期限後は削除 |
| 保管先 | DBと別の暗号化された非公開保存先。サービス・費用は確認待ち |
| 復旧担当 | GtoWellの公開責任者を主担当、別メンバーを確認担当とする。担当者名は公開前に指定 |
| 復旧目標 | 最大24時間分の損失、復旧開始から1時間以内を目標。クラウドでは未測定 |
| 訓練 | 公開前・DB変更後に別DBへ復元、以後月1回を目安 |

dumpには学習メモ、メール、パスワードhash、session、OAuth情報が含まれる。Git・PRへdumpや行データを載せない。保存先の暗号化と担当者の権限を確認する。共有する証拠は件数・総分数・一致判定に絞る。

## 専用ローカルDockerでの手順

本番・共有DBには使用しない。元DBと復元先は別コンテナ、復元先は新規の空DBにする。既存データを上書きせず、`--clean`は使わない。

PowerShell例の変数は操作前に対象コンテナ・DB・担当者専用フォルダーへ置き換える。接続の秘密値は例に書かない。

```powershell
$sourceContainer = 'studyquest-source-local'
$sourceDb = 'studyquest_source'
$sourceUser = 'studyquest_source'
$restoreContainer = 'studyquest-restore-local'
$restoreDb = 'studyquest_restore'
$restoreUser = 'studyquest_restore'
$backupFolder = Join-Path $env:LOCALAPPDATA 'StudyQuest/backups'
$dumpName = 'studyquest-local-review.dump'
$dumpPath = Join-Path $backupFolder $dumpName

docker inspect $sourceContainer $restoreContainer --format '{{.Name}} {{json .NetworkSettings.Ports}}'
docker exec $sourceContainer psql -U $sourceUser -d $sourceDb -Atc 'SELECT current_database();'
docker exec $restoreContainer psql -U $restoreUser -d $restoreDb -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
```

今回専用のローカルコンテナ、意図した別DB、復元先のテーブル数0を確認する。dumpはアクセス制限されたリポジトリ外のフォルダーへ保存する。

```powershell
New-Item -ItemType Directory -Path $backupFolder -Force
docker exec $sourceContainer pg_dump -U $sourceUser -d $sourceDb --format=custom --no-owner --no-acl --file=/tmp/studyquest-local-review.dump
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }
docker cp "${sourceContainer}:/tmp/studyquest-local-review.dump" $dumpPath
if ($LASTEXITCODE -ne 0) { throw 'dump copy failed' }
Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256
docker cp $dumpPath "${restoreContainer}:/tmp/studyquest-local-review.dump"
if ($LASTEXITCODE -ne 0) { throw 'restore copy failed' }
docker exec $restoreContainer pg_restore --exit-on-error --no-owner --no-acl -U $restoreUser -d $restoreDb /tmp/studyquest-local-review.dump
if ($LASTEXITCODE -ne 0) { throw 'pg_restore failed' }
```

`pg_dump`は元DBを読み取り、`pg_restore`は復元先へ書き込む。失敗したDBを成功扱いにせず、理由を確認して別の新規空DBでやり直す。元DBは保持する。

## 照合・アプリの切り替え

元・復元先で次を比較する。認証テーブルの内容やパスワードhashを表示しない。

```sql
SELECT
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM quests) AS quests,
  (SELECT count(*) FROM user_quests) AS user_quests,
  (SELECT count(*) FROM study_logs) AS study_logs,
  (SELECT count(*) FROM activity_logs) AS activity_logs,
  (SELECT count(*) FROM accounts) AS accounts,
  (SELECT count(*) FROM sessions) AS sessions,
  (SELECT count(*) FROM _prisma_migrations) AS migrations,
  (SELECT coalesce(sum(minutes), 0) FROM study_logs) AS minutes;
```

件数に加え、ログ・進行・活動・usersのXP/pointsを安定順序で比較する。hash一致は内容比較の補助で、dumpの暗号化ではない。今回の結果は[集計証拠](progress/review/step04-restore-result.json)に記録した。

ローカルAPIの`DATABASE_URL`を復元先へ変えて再起動し、本人のログ・受注状態・達成・週間分数・XP/pointsを画面でも確認する。seedは実行しない。migration履歴も照合する。

本番復旧は別DBで検証してから担当者が切り替えを判断する。障害後の記録欠落、復元sessionの扱い、利用者への案内を確認する。漏洩を伴う場合の認証鍵交換・session失効は別途必要。本番へ戻す操作はローカル試験の承認に含まれない。

## 確認範囲

PostgreSQL 16のダミーデータを別コンテナの空DBへ復元。ログ1件/5分、進行2件、活動4件、XP/points等の一致と、復元先へ切り替えた画面を確認した。5分は手入力値で、実時間5分の計測ではない。

クラウドDB、定期取得、保管先の暗号化、保持期限の削除、実運用担当、1時間以内の復旧は未確認。[配置準備](release.md)、[DB schema/migration手順](db.md)も参照する。
