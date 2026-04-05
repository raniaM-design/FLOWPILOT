import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import type { DashboardStandupInfo } from "@/lib/standup/dashboard-standup";
import { getTranslations } from "@/i18n/request";

export async function DashboardStandupSection({
  info,
}: {
  info: DashboardStandupInfo;
}) {
  if (!info.showStandupCta && info.streak <= 0 && !info.completedToday) {
    return null;
  }

  const t = await getTranslations("dashboard.standupBanner");

  const streakText =
    info.streak <= 1
      ? t("streakOne", { count: info.streak })
      : t("streakMany", { count: info.streak });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        {info.streak > 0 && (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Flame className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
            <span>{streakText}</span>
          </div>
        )}
        {info.completedToday && (
          <p className="text-sm text-slate-600">{t("completedToday")}</p>
        )}
        {!info.showStandupCta && info.streak > 0 && !info.completedToday && (
          <p className="text-sm text-slate-600">{t("comebackTomorrow")}</p>
        )}
      </div>
      {info.showStandupCta && (
        <Button
          asChild
          className="h-auto shrink-0 rounded-xl bg-[#2563EB] px-6 py-2.5 font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1D4ED8]"
        >
          <Link href={info.standupHref}>{t("startCta")}</Link>
        </Button>
      )}
    </div>
  );
}
