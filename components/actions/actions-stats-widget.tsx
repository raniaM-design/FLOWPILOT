"use client";

import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Zap, Target, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ActionsStatsWidgetProps {
  inProgressCount: number;
  blockedCount: number;
  completedCount: number;
  overdueCount: number;
  decisionsCount: number;
  projectsCount: number;
}

export function ActionsStatsWidget({
  inProgressCount,
  blockedCount,
  completedCount,
  overdueCount,
  decisionsCount,
  projectsCount,
}: ActionsStatsWidgetProps) {
  const t = useTranslations("actions");
  const tNav = useTranslations("navigation");

  const total =
    inProgressCount + blockedCount + completedCount + overdueCount;

  const slices = [
    {
      key: "inProgress",
      name: t("donutInProgress"),
      value: inProgressCount,
      color: "#2563EB",
    },
    {
      key: "blocked",
      name: t("donutBlocked"),
      value: blockedCount,
      color: "#D97706",
    },
    {
      key: "completed",
      name: t("donutCompleted"),
      value: completedCount,
      color: "#16A34A",
    },
    {
      key: "overdue",
      name: t("donutOverdue"),
      value: overdueCount,
      color: "#DC2626",
    },
  ].filter((s) => s.value > 0);

  const pct = (n: number) =>
    total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

  return (
    <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
      <FlowCardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#2563EB] flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-1 leading-tight">
                {t("progressTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                {t("progressSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          <div className="w-[200px] h-[200px] shrink-0 mx-auto sm:mx-0">
            {slices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    {slices.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="flex-1 w-full space-y-2.5">
            {[
              {
                key: "inProgress",
                label: t("donutInProgress"),
                value: inProgressCount,
                color: "#2563EB",
              },
              {
                key: "blocked",
                label: t("donutBlocked"),
                value: blockedCount,
                color: "#D97706",
              },
              {
                key: "completed",
                label: t("donutCompleted"),
                value: completedCount,
                color: "#16A34A",
              },
              {
                key: "overdue",
                label: t("donutOverdue"),
                value: overdueCount,
                color: "#DC2626",
              },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-[#374151] truncate">{row.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className="font-semibold text-[#111111]">{row.value}</span>
                  <span className="text-xs text-[#667085] w-12 text-right">
                    {total > 0 ? `${pct(row.value)}%` : "—"}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-[#667085] pt-2 border-t border-[#E5E7EB]">
              {t("totalActions", { count: total })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-[#FFF7ED] rounded-xl border border-[#FDE68A] p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#D97706]" />
              <span className="text-xs sm:text-sm font-medium text-[#D97706]">
                {tNav("decisions")}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#D97706]">
              {decisionsCount}
            </div>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#2563EB]" />
              <span className="text-xs sm:text-sm font-medium text-[#2563EB]">
                {tNav("projects")}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#2563EB]">
              {projectsCount}
            </div>
          </div>
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}
