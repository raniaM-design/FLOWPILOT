"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ActionStatusDistribution } from "@/lib/review/monthly-calculations";
import { useTranslations } from "next-intl";

interface ActionStatusChartProps {
  data: ActionStatusDistribution[];
}

const COLORS = {
  TODO: "#3B82F6", // blue-500
  DOING: "#8B5CF6", // purple-500
  DONE: "#22C55E", // emerald-500
  BLOCKED: "#F59E0B", // amber-500
};

const getStatusColor = (status: string): string => {
  return COLORS[status as keyof typeof COLORS] || "#94A3B8";
};

export function ActionStatusChart({ data }: ActionStatusChartProps) {
  const t = useTranslations("review.monthly");
  
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      TODO: t("status.todo"),
      DOING: t("status.doing"),
      DONE: t("status.done"),
      BLOCKED: t("status.blocked"),
    };
    return statusMap[status] || status;
  };

  const chartData = data.map((item) => ({
    ...item,
    label: getStatusLabel(item.status),
    color: getStatusColor(item.status),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="count"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "8px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

