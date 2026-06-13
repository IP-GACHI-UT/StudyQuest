"use client";

import Card from "./Card";
import { Tag } from "./Tag";

type MyQuestCardProps = {
    status: "進行中" | "達成済み" | "キャンセル済み";
    title: string;
    category: string;
    difficulty: string;
    buttonLabel: string;
    onButtonClick: () => void;
};

export const MyQuestCard = ({
  status,
  title,
  category,
  difficulty,
  buttonLabel,
  onButtonClick,
}: MyQuestCardProps) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <Tag label={status} color="blue" />

        <button onClick={onButtonClick} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          {buttonLabel}
        </button>
      </div>

      <p className="mt-3 font-semibold">
        {title}
      </p>

      <div className="mt-2 flex gap-4 text-sm text-gray-500">
        <span>{category}</span>
        <span>{difficulty}</span>
      </div>
    </Card>
  );
};