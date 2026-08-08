export async function acceptQuest(questId: string | number) {
  const response = await fetch(`/api/quests/${questId}/accept`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.error?.message ?? 'クエストの受注に失敗しました。';

    throw new Error(message);
  }

  return response.json();
}
