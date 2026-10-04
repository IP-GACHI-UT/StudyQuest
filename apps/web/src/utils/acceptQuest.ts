import { apiRequest } from '@/lib/api';
export function acceptQuest(questId: string | number) {
  return apiRequest(`/quests/${encodeURIComponent(questId)}/accept`, {
    method: 'POST',
  });
}
