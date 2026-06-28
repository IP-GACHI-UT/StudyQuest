export const DIFFICULTIES = ['初級', '中級', '上級'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
