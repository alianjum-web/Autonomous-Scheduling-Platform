"use client";

import { Bar, BarChart, ResponsiveContainer } from "recharts";

interface MiniBarChartProps {
  data: { value: number }[];
  color?: string;
}

export function MiniBarChart({ data, color = "hsl(var(--primary))" }: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
