'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

type WeeklyStudyChartProps = {
  data: {
    day: string;
    hours: number;
  }[];
};

export const WeeklyStudyChart = ({ data }: WeeklyStudyChartProps) => {
  return (
    <div className="h-48 w-full min-w-0">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="day" />

          <Tooltip formatter={(value) => [`${value}時間`, '学習時間']} />

          <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
