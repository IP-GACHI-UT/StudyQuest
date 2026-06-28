# StudyQuest API仕様

このディレクトリでは、StudyQuest MVPのAPI仕様をOpenAPI形式で管理します。

## ファイル

- `openapi.yaml`: APIのパス、リクエスト、レスポンス、エラー形式をまとめた契約書です。

## Swagger Editorで確認する手順

1. ブラウザで <https://editor.swagger.io/> を開きます。
2. 左側のエディタに `docs/api/openapi.yaml` の内容を貼り付けます。
3. 右側にAPI一覧が表示されることを確認します。
4. エラーが表示された場合は、行番号を確認してYAMLのインデントや参照先を見直します。

## フロントエンド担当が見るポイント

- `paths`: APIのURL、HTTPメソッド、summaryを確認します。
- `parameters`: パスパラメータやクエリパラメータの名前と必須条件を確認します。
- `requestBody`: POST時に送るJSONの形を確認します。
- `responses`: 成功時のJSONと、エラー時のJSONを確認します。
- `components.schemas`: 画面で使うデータの項目名、型、nullableを確認します。
- `x-implementation-status`: `implemented` は今回実装済み、`planned` は仕様のみです。

## エラー形式

APIのエラーは次のJSON形式に統一します。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "学習記録の入力内容を確認してください。",
    "details": []
  }
}
```

フロントエンドでは、基本的に `error.message` をユーザー表示、`error.code` を分岐処理に使います。
