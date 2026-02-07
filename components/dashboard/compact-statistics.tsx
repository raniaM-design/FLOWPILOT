"use client";

import Link from "next/link";
import { FolderKanban, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface CompactStatisticsProps {
  activeProjects: number;
  tasksInProgress: number;
  overdueCount: number;
  completionRate: number;
}

/**
 * Cartes statistiques compactes et cliquables - En haut du dashboard
 */
export function CompactStatistics({
  activeProjects,
  tasksInProgress,
  overdueCount,
  completionRate,
}: CompactStatisticsProps) {
  const stats = [
    {
      label: "Projets actifs",
      value: activeProjects,
      icon: FolderKanban,
      color: "purple",
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
      color: "blue",
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
      color: "red",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-700",
      href: "/app/actions?filter=overdue",
    },
    {
      label: "Taux de complétion",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "emerald",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
      href: "/app/actions",
      showProgress: true,
      progress: completionRate,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, index) => (
        <Link
          key={index}
          href={stat.href}
          className={`${stat.bg} rounded-lg shadow-sm hover:shadow-md transition-all p-3 group cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            {stat.showProgress && (
              <div className={`text-xs font-bold ${stat.textColor} bg-white/70 px-2 py-0.5 rounded-full`}>
                {completionRate}%
              </div>
            )}
          </div>
          <div className={`text-xl font-bold ${stat.textColor} mb-0.5`}>
            {stat.value}
          </div>
          <div className="text-xs font-medium text-slate-600">
            {stat.label}
          </div>
          {stat.showProgress && (
            <div className="mt-2">
              <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stat.color === "emerald"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-700"
                      : stat.color === "blue"
                      ? "bg-gradient-to-r from-blue-500 to-blue-700"
                      : stat.color === "red"
                      ? "bg-gradient-to-r from-red-500 to-red-700"
                      : "bg-gradient-to-r from-purple-500 to-purple-700"
                  }`}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

