"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { WeeklyActivity } from "@/lib/review/monthly-calculations";
import { useTranslations } from "next-intl";

interface WeeklyActivityChartProps {
  data: WeeklyActivity[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const t = useTranslations("review.monthly");
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="weekLabel"
          stroke="#64748B"
          fontSize={12}
        />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="meetings"
          name={t("charts.weeklyActivity.meetings")}
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="actionsCreated"
          name={t("charts.weeklyActivity.actionsCreated")}
          stroke="#22C55E"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="decisionsTaken"
          name={t("charts.weeklyActivity.decisionsTaken")}
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

