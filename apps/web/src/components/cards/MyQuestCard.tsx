'use client';

import Link from 'next/link';
import { Card } from '../common/Card';
import { Tag } from '../common/Tag';

type MyQuestCardProps = {
  status: '進行中' | '達成済み' | 'キャンセル済み';
  title: string;
  category: string;
  difficulty: string;
  buttonLabel: string;
  href: string;
};

export const MyQuestCard = ({
  status,
  title,
  category,
  difficulty,
  buttonLabel,
  href,
}: MyQuestCardProps) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <Tag label={status} color="blue" />

        <Link
          href={href}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {buttonLabel}
        </Link>
      </div>

      <p className="mt-3 font-semibold">{title}</p>

      <div className="mt-2 flex gap-4 text-sm text-gray-300">
        <span>{category}</span>
        <span>{difficulty}</span>
      </div>
    </Card>
  );
};
