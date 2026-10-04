import { CATEGORIES, type Category } from '@/constants/quest/category';

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('ログインの有効期限が切れました。再度ログインしてください。');
    this.name = 'AuthenticationRequiredError';
  }
}

export function currentLoginHref() {
  return `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
    });
  } catch (cause) {
    if (init?.signal?.aborted) throw cause;
    throw new Error(
      'APIに接続できませんでした。通信状態を確認し、再試行してください。',
    );
  }
  if (!response.ok) {
    if (response.status === 401) throw new AuthenticationRequiredError();
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message ?? '通信に失敗しました。もう一度お試しください。',
    );
  }
  return response.json() as Promise<T>;
}
export type ApiQuest = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'normal' | 'hard';
  estimatedMinutes: number;
  acceptPoint: number;
  clearPoint: number;
  xpReward: number;
};
export type UserQuest = {
  id: string;
  status: 'in_progress' | 'completed' | 'canceled';
  acceptedAt: string;
  completedAt: string | null;
  quest: ApiQuest;
};
export type StudyLog = {
  id: string;
  questId: string;
  minutes: number;
  note: string | null;
  studiedAt: string;
};
export type WeeklySummary = {
  studyMinutes: number;
  completedQuestCount: number;
  earnedXp: number;
  streakDays: number;
  dailyStudyMinutes: { date: string; minutes: number }[];
};
export type Profile = {
  displayName: string;
  level: number;
  totalPoints: number;
  totalXp: number;
  totalStudyMinutes: number;
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string | null;
  }[];
};
export type StudyLogDraft = {
  requestId: string;
  questId: string;
  minutes: number;
  note: string;
  studiedAt: string;
};
export const difficultyLabel = {
  easy: '初級',
  normal: '中級',
  hard: '上級',
} as const;
export const statusLabel = {
  in_progress: '進行中',
  completed: '達成済み',
  canceled: 'キャンセル済み',
} as const;
export function categoryLabel(category: string): Category {
  return CATEGORIES.includes(category as Category)
    ? (category as Category)
    : 'その他';
}
export function formatStudyMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}時間 ${minutes % 60}分` : `${minutes}分`;
}
