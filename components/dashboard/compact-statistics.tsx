"use client";

import Link from "next/link";
import { FolderKanban, Clock, AlertCircle, Activity, ArrowDown, ArrowUp } from "lucide-react";

interface CompactStatisticsProps {
  activeProjects: number;
  tasksInProgress: number;
  overdueCount: number;
  totalActionsCount: number;
  healthScore: number;
  healthTrend: "up" | "down" | "flat";
}

function healthTier(score: number): "red" | "orange" | "green" {
  if (score < 30) return "red";
  if (score <= 60) return "orange";
  return "green";
}

const HEALTH_STYLES = {
  red: {
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    textColor: "text-red-700",
    bar: "bg-gradient-to-r from-red-500 to-red-700",
  },
  orange: {
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    textColor: "text-orange-700",
    bar: "bg-gradient-to-r from-orange-500 to-orange-700",
  },
  green: {
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-700",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-700",
  },
} as const;

/**
 * Cartes statistiques compactes et cliquables - En haut du dashboard
 */
export function CompactStatistics({
  activeProjects,
  tasksInProgress,
  overdueCount,
  totalActionsCount,
  healthScore,
  healthTrend,
}: CompactStatisticsProps) {
  const tier = healthTier(healthScore);
  const hs = HEALTH_STYLES[tier];

  const stats = [
    {
      label: "Projets actifs",
      value: activeProjects,
      icon: FolderKanban,
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      textColor: "text-purple-700",
      href: "/app/projects",
    },
    {
      label: "Tâches en cours",
      value: tasksInProgress,
      icon: Clock,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-700",
      href: "/app/actions?filter=in-progress",
    },
    {
      label: "En retard",
      value: overdueCount,
      icon: AlertCircle,
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-700",
      href: "/app/actions?filter=overdue",
    },
  ];

  const overdueLabel =
    overdueCount <= 1
      ? `${overdueCount} action en retard sur ${totalActionsCount} au total`
      : `${overdueCount} actions en retard sur ${totalActionsCount} au total`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, index) => (
        <Link
          key={index}
          href={stat.href}
          className={`${stat.bg} rounded-lg shadow-sm hover:shadow-md transition-all p-3 group cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
            >
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </div>
          <div className={`text-xl font-bold ${stat.textColor} mb-0.5`}>{stat.value}</div>
          <div className="text-xs font-medium text-slate-600">{stat.label}</div>
        </Link>
      ))}

      <Link
        href="/app/actions"
        className={`${hs.bg} rounded-lg shadow-sm hover:shadow-md transition-all p-3 group cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div
            className={`h-8 w-8 rounded-lg ${hs.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
          >
            <Activity className={`h-4 w-4 ${hs.iconColor}`} />
          </div>
          {healthTrend !== "flat" && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                healthTrend === "up" ? "text-emerald-600" : "text-red-600"
              }`}
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
        <div className={`text-xl font-bold ${hs.textColor} mb-0.5 tabular-nums`}>{healthScore}%</div>
        <div className="text-xs font-medium text-slate-600">Score de santé</div>
        <p className="text-[11px] leading-snug text-slate-500 mt-1.5">{overdueLabel}</p>
        <div className="mt-2">
          <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${hs.bar}`} style={{ width: `${healthScore}%` }} />
          </div>
        </div>
      </Link>
    </div>
  );
}
