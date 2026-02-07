"use client";

import { Chip } from "@/components/ui/chip";
import { AlertCircle, Ban, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface DashboardStatsProps {
  overdueCount: number;
  blockedCount: number;
  weekCount: number;
}

/**
 * Stats chips pour le header du dashboard
 */
export function DashboardStats({ overdueCount, blockedCount, weekCount }: DashboardStatsProps) {
  const t = useTranslations("dashboard");
  
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {overdueCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="font-bold text-sm text-red-600">{overdueCount}</span>
          <span className="text-sm text-slate-700 font-medium">{t("toProcess")}</span>
        </div>
      )}
      {blockedCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <Ban className="h-4 w-4 text-orange-600" />
          <span className="font-bold text-sm text-orange-600">{blockedCount}</span>
          <span className="text-sm text-slate-700 font-medium">{blockedCount > 1 ? t("blockedPlural") : t("blocked")}</span>
        </div>
      )}
      {weekCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-bold text-sm text-blue-600">{weekCount}</span>
          <span className="text-sm text-slate-700 font-medium">{t("thisWeek")}</span>
        </div>
      )}
    </div>
  );
}

