import { Chip } from "@/components/ui/chip";
import { AlertCircle, Ban, Calendar } from "lucide-react";

interface DashboardStatsProps {
  overdueCount: number;
  blockedCount: number;
  weekCount: number;
}

/**
 * Stats chips pour le header du dashboard
 */
export function DashboardStats({ overdueCount, blockedCount, weekCount }: DashboardStatsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {overdueCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-red-50 border border-red-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-red-700">{overdueCount}</span>
          <span className="text-red-600 font-medium">à traiter</span>
        </div>
      )}
      {blockedCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <Ban className="h-4 w-4 text-orange-600" />
          <span className="font-semibold text-orange-700">{blockedCount}</span>
          <span className="text-orange-600 font-medium">bloquée{blockedCount > 1 ? "s" : ""}</span>
        </div>
      )}
      {weekCount > 0 && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-700">{weekCount}</span>
          <span className="text-blue-600 font-medium">cette semaine</span>
        </div>
      )}
    </div>
  );
}

