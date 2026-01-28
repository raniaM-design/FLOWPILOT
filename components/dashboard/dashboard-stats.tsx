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
        <Chip variant="danger" size="sm" className="gap-1.5 font-normal">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="font-medium">{overdueCount}</span>
          <span>à traiter</span>
        </Chip>
      )}
      {blockedCount > 0 && (
        <Chip variant="warning" size="sm" className="gap-1.5 font-normal">
          <Ban className="h-3.5 w-3.5" />
          <span className="font-medium">{blockedCount}</span>
          <span>bloquée{blockedCount > 1 ? "s" : ""}</span>
        </Chip>
      )}
      {weekCount > 0 && (
        <Chip variant="info" size="sm" className="gap-1.5 font-normal">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-medium">{weekCount}</span>
          <span>cette semaine</span>
        </Chip>
      )}
    </div>
  );
}

