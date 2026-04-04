import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import type { DashboardStandupInfo } from "@/lib/standup/dashboard-standup";

export function DashboardStandupSection({
  info,
}: {
  info: DashboardStandupInfo;
}) {
  if (!info.showStandupCta && info.streak <= 0 && !info.completedToday) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 px-4 py-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        {info.streak > 0 && (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Flame className="h-5 w-5 text-orange-500 shrink-0" aria-hidden />
            <span>
              {info.streak} jour{info.streak > 1 ? "s" : ""} de suite
            </span>
          </div>
        )}
        {info.completedToday && (
          <p className="text-sm text-slate-600">Standup enregistré pour aujourd&apos;hui.</p>
        )}
        {!info.showStandupCta && info.streak > 0 && !info.completedToday && (
          <p className="text-sm text-slate-600">
            Reviens demain matin dans ta fenêtre habituelle pour prolonger la série.
          </p>
        )}
      </div>
      {info.showStandupCta && (
        <Button
          asChild
          className="shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-6 py-2.5 h-auto rounded-xl shadow-md shadow-blue-500/20"
        >
          <Link href={info.standupHref}>Démarrer mon standup</Link>
        </Button>
      )}
    </div>
  );
}
