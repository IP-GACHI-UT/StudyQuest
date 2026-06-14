"use client";

import Card from "./Card";

type ProfileCardProps = {
  userName: string;
  level: number;
  totalPoints: number;
  totalXp: number;
  totalStudyTime: string;
  icon: React.ReactNode;
  onProfileClick?: () => void;
};

export const ProfileCard = ({
  userName,
  level,
  totalPoints,
  totalXp,
  totalStudyTime,
  icon,
  onProfileClick,
}: ProfileCardProps) => {
  return (
    <Card>
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold">{userName}</h2>
          <p className="text-sm text-gray-500">Lv.{level}</p>
        </div>
      </div>

      {/* ステータス */}
      <div className="mt-6 grid grid-cols-[auto_1fr] gap-y-2">
        <span>累計ポイント</span>
        <span className="text-right">{totalPoints}</span>

        <span>累計XP</span>
        <span className="text-right">{totalXp}</span>

        <span>累計学習時間</span>
        <span className="text-right">{totalStudyTime}</span>
      </div>

      {/* ボタン */}
      <button
        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={onProfileClick}
      >
        プロフィール
      </button>
    </Card>
  );
};