export const CATEGORIES = [
  'フロントエンド',
  'バックエンド',
  'データベース',
  'アルゴリズム',
  '英語',
  'その他',
] as const;

export type Category = (typeof CATEGORIES)[number];
