'use client';

import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import type { Category } from "@/constants/quest/category";
import type { Difficulty } from "@/constants/quest/difficulty";

type RecommendedQuestCardProps = {
  title: string;
  difficulty: Difficulty;
  description: string;
  category: Category;
  duration: string;
  acceptPoint: number;
  clearPoint: number;
  onAccept: () => void;
};

export const RecommendedQuestCard = ({
  title,
  difficulty,
  description,
  category,
  duration,
  acceptPoint,
  clearPoint,
  onAccept,
}: RecommendedQuestCardProps) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-lg">{title}</h3>

        <Tag label={difficulty} color="green" />
      </div>

      <p className="mt-3 text-sm text-gray-500">{description}</p>

      <div className="mt-4 flex items-center gap-2">
        <Tag label={category} color="blue" />

        <span className="text-sm text-gray-500">{duration}</span>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <span>受注: +{acceptPoint}pt</span>

        <span>達成: +{clearPoint}pt</span>
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2"
        onClick={onAccept}
      >
        クエスト受注
      </button>
    </Card>
  );
};
