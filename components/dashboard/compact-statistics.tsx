"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

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
  const overdueSub =
    overdueDueThisWeekCount > 0
      ? `+${overdueDueThisWeekCount} cette semaine`
      : overdueCount <= 1
        ? `${overdueCount} action en retard`
        : `${overdueCount} actions en retard`;

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Link
        href="/app/projects"
        className={CARD_BASE}
        style={{ backgroundColor: "#2D5BE3" }}
      >
        <p className={LABEL_CLASS}>Projets actifs</p>
        <p className={`${VALUE_CLASS} mt-1`}>{activeProjects}</p>
        <p className={SUB_CLASS}>
          sur {totalProjects} au total
        </p>
      </Link>

      <Link
        href="/app/actions?filter=in-progress"
        className={CARD_BASE}
        style={{ backgroundColor: "#7C3AED" }}
      >
        <p className={LABEL_CLASS}>Tâches en cours</p>
        <p className={`${VALUE_CLASS} mt-1`}>{tasksInProgress}</p>
        <p className={SUB_CLASS}>{totalActionsCount} au total</p>
      </Link>

      <Link
        href="/app/actions?filter=overdue"
        className={CARD_BASE}
        style={{ backgroundColor: "#E03535" }}
      >
        <p className={LABEL_CLASS}>En retard</p>
        <p className={`${VALUE_CLASS} mt-1`}>{overdueCount}</p>
        <p className={SUB_CLASS}>{overdueSub}</p>
      </Link>

      <Link
        href="/app/actions"
        className={CARD_BASE}
        style={{ backgroundColor: "#D97706" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={LABEL_CLASS}>Score santé</p>
          {healthTrend !== "flat" && (
            <span
              className="inline-flex shrink-0 items-center text-white/90"
              aria-label={
                healthTrend === "up"
                  ? "En hausse par rapport à la semaine précédente"
                  : "En baisse par rapport à la semaine précédente"
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
        <p className={`${VALUE_CLASS} mt-1`}>{healthScore}%</p>
        <p className={SUB_CLASS}>Terminées vs. retard</p>
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
