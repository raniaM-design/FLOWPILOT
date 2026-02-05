"use client";

import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Zap, Target, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";

interface ActionsStatsWidgetProps {
  overdueCount: number;
  todoThisWeekCount: number;
  completedCount: number;
  decisionsCount: number;
  projectsCount: number;
}

export function ActionsStatsWidget({
  overdueCount,
  todoThisWeekCount,
  completedCount,
  decisionsCount,
  projectsCount,
}: ActionsStatsWidgetProps) {
  const t = useTranslations("actions");
  const tDashboard = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  return (
    <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
      <FlowCardContent className="p-6">
        {/* En-tête avec tags */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2563EB] flex items-center justify-center flex-shrink-0">
              <Zap className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111111] mb-1 leading-tight">
                {t("progressTitle")}
              </h3>
              <p className="text-sm text-[#667085] leading-relaxed">
                {t("progressSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {overdueCount > 0 && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                {overdueCount} {t("overdueLabel")}
              </span>
            )}
            {todoThisWeekCount > 0 && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                {todoThisWeekCount} {t("todoLabel")}
              </span>
            )}
          </div>
        </div>

        {/* Barres de progression */}
        <div className="space-y-4 mb-6">
          {/* Actions en retard */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#111111]">{t("overdueActions")}</span>
              <span className="text-sm font-semibold text-[#111111]">{overdueCount}</span>
            </div>
            <div className="w-full h-3 bg-[#FEF2F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B91C1C] transition-all duration-300"
                style={{ width: overdueCount > 0 ? "100%" : "0%" }}
              />
            </div>
          </div>

          {/* À faire cette semaine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#111111]">{tDashboard("thisWeekActions")}</span>
              <span className="text-sm font-semibold text-[#111111]">{todoThisWeekCount}</span>
            </div>
            <div className="w-full h-3 bg-[#EFF6FF] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-300"
                style={{ width: todoThisWeekCount > 0 ? "100%" : "0%" }}
              />
            </div>
          </div>

          {/* Terminées */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#111111]">{t("completed")}</span>
              <span className="text-sm font-semibold text-[#111111]">{completedCount}</span>
            </div>
            <div className="w-full h-3 bg-[#ECFDF5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16A34A] transition-all duration-300"
                style={{ width: completedCount > 0 ? "100%" : "0%" }}
              />
            </div>
          </div>
        </div>

        {/* Cartes Décisions et Projets */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FFF7ED] rounded-xl border border-[#FDE68A] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-[#D97706]" />
              <span className="text-sm font-medium text-[#D97706]">{tNav("decisions")}</span>
            </div>
            <div className="text-2xl font-bold text-[#D97706]">{decisionsCount}</div>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="h-4 w-4 text-[#2563EB]" />
              <span className="text-sm font-medium text-[#2563EB]">{tNav("projects")}</span>
            </div>
            <div className="text-2xl font-bold text-[#2563EB]">{projectsCount}</div>
          </div>
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

