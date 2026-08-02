export async function acceptQuest(questId: string | number) {
  const response = await fetch(
    `http://localhost:3001/api/quests/${questId}/accept`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.error?.message ?? 'クエストの受注に失敗しました。';

    throw new Error(message);
  }

  return response.json();
}
