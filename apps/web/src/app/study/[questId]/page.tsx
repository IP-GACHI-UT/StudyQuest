'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ResourceNotice } from '@/components/common/ResourceNotice';
import { StudyTimer } from '@/components/study/StudyTimer';
import { useApiResource } from '@/hooks/useApiResource';
import { type StudyLog, statusLabel, type UserQuest } from '@/lib/api';

function StudyQuest({ questId }: { questId: string }) {
  const quests = useApiResource<{ userQuests: UserQuest[] }>('/my-quests');
  const logs = useApiResource<{ studyLogs: StudyLog[] }>('/study-logs');
  const item = quests.data?.userQuests.find(
    (value) => value.quest.id === questId,
  );
  const records =
    logs.data?.studyLogs.filter((log) => log.questId === questId) ?? [];
  function afterSave() {
    quests.reload();
    logs.reload();
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/my-quest" className="text-blue-600 underline">
        マイクエストへ戻る
      </Link>
      <ResourceNotice {...quests} />
      {quests.data !== null &&
        !quests.error &&
        (item ? (
          <>
            <div>
              <h1 className="text-2xl font-bold">{item.quest.title}</h1>
              <p className="mt-2">{item.quest.description}</p>
              <p className="mt-2 text-sm text-gray-500">
                {statusLabel[item.status]}・目安 {item.quest.estimatedMinutes}分
              </p>
            </div>
            {item.status === 'in_progress' ? (
              <StudyTimer questId={questId} afterSave={afterSave} />
            ) : (
              <p>
                このクエストは{statusLabel[item.status]}
                です。学習記録を確認できます。
              </p>
            )}
          </>
        ) : (
          <p>
            このクエストは受注していません。
            <Link href="/quests" className="ml-2 text-blue-600 underline">
              クエストを探す
            </Link>
          </p>
        ))}
      <section>
        <h2 className="text-lg font-bold">このクエストの学習記録</h2>
        <ResourceNotice {...logs} />
        {!logs.loading &&
          !logs.error &&
          (records.length ? (
            <>
              <p className="my-2">
                累計 {records.reduce((sum, log) => sum + log.minutes, 0)}分
              </p>
              <ul className="space-y-3">
                {records.map((log) => (
                  <li key={log.id} className="rounded border p-3">
                    <time dateTime={log.studiedAt}>
                      {new Date(log.studiedAt).toLocaleString('ja-JP', {
                        timeZone: 'Asia/Tokyo',
                      })}
                    </time>
                    <p>
                      {log.minutes}分{log.note ? `・${log.note}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3">学習記録はまだありません。</p>
          ))}
      </section>
      <Link href="/dashboard" className="inline-block text-blue-600 underline">
        ホームで今週の学習状況を見る
      </Link>
    </div>
  );
}
export default function StudyPage() {
  const { questId } = useParams<{ questId: string }>();
  return <StudyQuest key={questId} questId={questId} />;
}
