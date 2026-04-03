"use client";

import type { WeeklyStatsMetricKey } from "@/lib/review/weekly-stats-history";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { LineChart, Line, BarChart, Bar } from "recharts";
import {
  Target,
  CheckSquare,
  Ban,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

type Series7 = Record<WeeklyStatsMetricKey, number[]>;

const METRICS: {
  key: WeeklyStatsMetricKey;
  label: string;
  icon: typeof Target;
  cardClass: string;
  valueClass: string;
  iconClass: string;
  sparkColor: string;
  barColor: string;
  upIsGood: boolean;
}[] = [
  {
    key: "decisionsTaken",
    label: "Décisions prises",
    icon: Target,
    cardClass: "bg-[#F0FDF4]",
    valueClass: "text-[#059669]",
    iconClass: "text-[#059669]",
    sparkColor: "#059669",
    barColor: "#059669",
    upIsGood: true,
  },
  {
    key: "actionsCompleted",
    label: "Actions terminées",
    icon: CheckSquare,
    cardClass: "bg-[#F0FDF4]",
    valueClass: "text-[#059669]",
    iconClass: "text-[#059669]",
    sparkColor: "#059669",
    barColor: "#10B981",
    upIsGood: true,
  },
  {
    key: "actionsBlocked",
    label: "Actions bloquées",
    icon: Ban,
    cardClass: "bg-[#FFFBEB]",
    valueClass: "text-[#D97706]",
    iconClass: "text-[#D97706]",
    sparkColor: "#D97706",
    barColor: "#F59E0B",
    upIsGood: false,
  },
  {
    key: "actionsOverdue",
    label: "Actions en retard",
    icon: AlertCircle,
    cardClass: "bg-[#FEF2F2]",
    valueClass: "text-[#DC2626]",
    iconClass: "text-[#DC2626]",
    sparkColor: "#DC2626",
    barColor: "#EF4444",
    upIsGood: false,
  },
  {
    key: "decisionsAtRisk",
    label: "Décisions à surveiller",
    icon: AlertTriangle,
    cardClass: "bg-[#FFFBEB]",
    valueClass: "text-[#D97706]",
    iconClass: "text-[#D97706]",
    sparkColor: "#D97706",
    barColor: "#F97316",
    upIsGood: false,
  },
];

function deltaTone(
  key: WeeklyStatsMetricKey,
  delta: number,
): "good" | "bad" | "neutral" {
  if (delta === 0) return "neutral";
  const upIsGood =
    key === "decisionsTaken" || key === "actionsCompleted";
  if (upIsGood) return delta > 0 ? "good" : "bad";
  return delta > 0 ? "bad" : "good";
}

function formatDeltaLine(delta: number): string {
  if (delta === 0) return "0 vs sem. passée";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} vs sem. passée`;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="flex justify-center mt-2" aria-hidden>
      <LineChart
        width={60}
        height={24}
        data={chartData}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}

function MonthTrendBars({ values, fill }: { values: number[]; fill: string }) {
  const chartData = values.map((v, i) => ({ i, v }));
  return (
    <div className="shrink-0" aria-hidden>
      <BarChart
        width={100}
        height={36}
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
      >
        <Bar
          dataKey="v"
          fill={fill}
          radius={[2, 2, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </div>
  );
}

export function ReviewWeeklyStats({ series7 }: { series7: Series7 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {METRICS.map((m) => {
        const series = series7[m.key];
        const value = series[6] ?? 0;
        const prev = series[5] ?? 0;
        const delta = value - prev;
        const tone = deltaTone(m.key, delta);
        const deltaClass =
          tone === "good"
            ? "text-[#059669]"
            : tone === "bad"
              ? "text-[#DC2626]"
              : "text-[#667085]";

        return (
          <div
            key={m.key}
            className={`text-center p-5 ${m.cardClass} rounded-xl shadow-sm flex flex-col`}
          >
            <div className="flex items-center justify-center mb-2">
              <m.icon className={`h-5 w-5 ${m.iconClass}`} />
            </div>
            <div
              className={`text-2xl font-bold ${m.valueClass} mb-0.5 tabular-nums`}
            >
              {value}
            </div>
            <p className={`text-[11px] font-medium leading-tight ${deltaClass}`}>
              {formatDeltaLine(delta)}
            </p>
            <div className="text-xs text-[#667085] font-medium mt-1 mb-1">
              {m.label}
            </div>
            <MiniSparkline data={series} color={m.sparkColor} />
          </div>
        );
      })}
    </div>
  );
}

export function ReviewWeeklyMonthTrend({ series7 }: { series7: Series7 }) {
  return (
    <FlowCard variant="default" className="bg-white shadow-sm">
      <FlowCardContent className="p-8">
        <h4 className="text-sm font-semibold text-[#111111] mb-1">
          Tendance du mois
        </h4>
        <p className="text-xs text-[#667085] mb-6">
          Quatre dernières semaines par indicateur
        </p>
        <div className="space-y-4">
          {METRICS.map((m) => {
            const last4 = (series7[m.key] ?? []).slice(-4);
            return (
              <div
                key={m.key}
                className="flex items-center gap-4 flex-wrap sm:flex-nowrap"
              >
                <div className="w-full sm:w-40 shrink-0">
                  <span className="text-xs font-medium text-[#374151]">
                    {m.label}
                  </span>
                </div>
                <MonthTrendBars values={last4} fill={m.barColor} />
              </div>
            );
          })}
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}
