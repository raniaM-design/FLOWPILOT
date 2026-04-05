"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface Decision {
  id: string;
  title: string;
  displayState?: "critical" | "to_monitor" | "ok";
}

interface DecisionsSectionProps {
  decisions: Decision[];
}

/**
 * Section Décisions — carte secondaire (bordure #E8EAF0)
 */
export function DecisionsSection({ decisions }: DecisionsSectionProps) {
  const t = useTranslations("dashboard.decisionsSection");

  if (decisions.length === 0) {
    return null;
  }

  const displayDecisions = decisions.slice(0, 2);
  const criticalCount = decisions.filter(
    (d) => d.displayState === "critical"
  ).length;

  const criticalLabel =
    criticalCount === 1
      ? t("criticalOne", { count: criticalCount })
      : t("criticalMany", { count: criticalCount });

  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-white shadow-none">
      <div className="flex items-center justify-between border-b border-[#E8EAF0] px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">{t("title")}</h2>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="text-sm text-slate-500">{criticalLabel}</span>
          )}
          {decisions.length > 2 && (
            <Link
              href="/app/decisions/risk"
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              {t("seeAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="divide-y divide-[#E8EAF0]">
        {displayDecisions.map((decision) => (
          <Link
            key={decision.id}
            href={`/app/decisions/${decision.id}`}
            className="block p-4 transition-colors hover:bg-[#FAFBFD]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {decision.title}
                  </h3>
                  {decision.displayState === "critical" && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {t("badgeCritical")}
                    </span>
                  )}
                  {decision.displayState === "to_monitor" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {t("badgeWatch")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
