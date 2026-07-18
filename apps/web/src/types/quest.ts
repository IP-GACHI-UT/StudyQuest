import type { Category } from '@/constants/quest/category';
import type { Difficulty } from '@/constants/quest/difficulty';

export type Quest = {
  id: number;
  title: string;
  difficulty: Difficulty;
  description: string;
  category: Category;
  duration: string;
  acceptPoint: number;
  clearPoint: number;
  acceptedToday?: number;
  completedToday?: number;
  completionRate?: number;
};
