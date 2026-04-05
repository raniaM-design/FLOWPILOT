"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompactStatisticsProps {
  activeProjects: number;
  totalProjects: number;
  tasksInProgress: number;
  overdueCount: number;
  totalActionsCount: number;
  /** Retards dont l’échéance tombe dans les 7 derniers jours (sous-texte carte) */
  overdueDueThisWeekCount: number;
  healthScore: number;
  healthTrend: "up" | "down" | "flat";
}

const CARD_BASE =
  "block rounded-[12px] px-4 py-[14px] shadow-none transition-opacity hover:opacity-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const LABEL_CLASS =
  "text-[11px] font-bold uppercase tracking-[0.03em] text-white/75";

const VALUE_CLASS =
  "text-[32px] font-bold leading-none tracking-[-0.03em] text-white tabular-nums";

const SUB_CLASS = "mt-1 text-[11px] text-white/75";

/**
 * Cartes statistiques plein fond — dashboard Pilotys
 */
export function CompactStatistics({
  activeProjects,
  totalProjects,
  tasksInProgress,
  overdueCount,
  totalActionsCount,
  overdueDueThisWeekCount,
  healthScore,
  healthTrend,
}: CompactStatisticsProps) {
  const t = useTranslations("dashboard.stats");

  const overdueSub =
    overdueDueThisWeekCount > 0
      ? t("overdueThisWeek", { count: overdueDueThisWeekCount })
      : overdueCount <= 1
        ? t("overdueLineOne", { count: overdueCount })
        : t("overdueLineMany", { count: overdueCount });

  return (
    <div className="mb-8 grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <Link
        href="/app/projects"
        className={`${CARD_BASE} min-w-0 overflow-hidden`}
        style={{ backgroundColor: "#2D5BE3" }}
      >
        <p className={`${LABEL_CLASS} break-words`}>{t("activeProjects")}</p>
        <p className={`${VALUE_CLASS} mt-1 text-[26px] sm:text-[32px]`}>
          {activeProjects}
        </p>
        <p className={`${SUB_CLASS} break-words leading-snug`}>
          {t("ofTotalProjects", { count: totalProjects })}
        </p>
      </Link>

      <Link
        href="/app/actions?filter=in-progress"
        className={`${CARD_BASE} min-w-0 overflow-hidden`}
        style={{ backgroundColor: "#7C3AED" }}
      >
        <p className={`${LABEL_CLASS} break-words`}>{t("tasksInProgress")}</p>
        <p className={`${VALUE_CLASS} mt-1 text-[26px] sm:text-[32px]`}>
          {tasksInProgress}
        </p>
        <p className={`${SUB_CLASS} break-words leading-snug`}>
          {t("actionsTotal", { count: totalActionsCount })}
        </p>
      </Link>

      <Link
        href="/app/actions?filter=overdue"
        className={`${CARD_BASE} min-w-0 overflow-hidden`}
        style={{ backgroundColor: "#E03535" }}
      >
        <p className={`${LABEL_CLASS} break-words`}>{t("overdue")}</p>
        <p className={`${VALUE_CLASS} mt-1 text-[26px] sm:text-[32px]`}>
          {overdueCount}
        </p>
        <p className={`${SUB_CLASS} break-words leading-snug`}>{overdueSub}</p>
      </Link>

      <Link
        href="/app/actions"
        className={`${CARD_BASE} min-w-0 overflow-hidden`}
        style={{ backgroundColor: "#D97706" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={LABEL_CLASS}>{t("healthScore")}</p>
          {healthTrend !== "flat" && (
            <span
              className="inline-flex shrink-0 items-center text-white/90"
              aria-label={
                healthTrend === "up" ? t("trendUpAria") : t("trendDownAria")
              }
            >
              {healthTrend === "up" ? (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
              )}
            </span>
          )}
        </div>
        <p className={`${VALUE_CLASS} mt-1 text-[26px] sm:text-[32px]`}>
          {healthScore}%
        </p>
        <p className={SUB_CLASS}>{t("healthSub")}</p>
        <div
          className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          role="progressbar"
          aria-valuenow={healthScore}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, healthScore))}%` }}
          />
        </div>
      </Link>
    </div>
  );
}
