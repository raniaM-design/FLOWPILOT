"use client";

import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { FolderKanban, CheckSquare, TrendingUp, Clock, Target, AlertCircle, Ban, Calendar } from "lucide-react";

interface ProfessionalStatisticsProps {
  totalActions: number;
  completedActions: number;
  overdueCount: number;
  blockedCount: number;
  weekCount: number;
  todayCount: number;
  activeProjects: number;
  tasksInProgress: number;
}

/**
 * Composant de statistiques professionnel avec visualisations
 */
export function ProfessionalStatistics({
  totalActions,
  completedActions,
  overdueCount,
  blockedCount,
  weekCount,
  todayCount,
  activeProjects,
  tasksInProgress,
}: ProfessionalStatisticsProps) {
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const activeActions = totalActions - completedActions;

  // Métriques principales avec icônes
  const mainMetrics = [
    {
      label: "Projets actifs",
      value: activeProjects,
      icon: FolderKanban,
      color: "purple",
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      textColor: "text-purple-700",
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
    },
    {
      label: "Tâches terminées",
      value: completedActions,
      icon: CheckSquare,
      color: "emerald",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
    },
    {
      label: "Taux de complétion",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "indigo",
      bg: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      textColor: "text-indigo-700",
      showProgress: true,
      progress: completionRate,
    },
  ];

  // Métriques d'urgence
  const urgencyMetrics = [
    {
      label: "Aujourd'hui",
      value: todayCount,
      icon: Calendar,
      color: "blue",
      bg: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      label: "Cette semaine",
      value: weekCount,
      icon: Calendar,
      color: "indigo",
      bg: "bg-indigo-100",
      textColor: "text-indigo-700",
    },
    {
      label: "En retard",
      value: overdueCount,
      icon: AlertCircle,
      color: "red",
      bg: "bg-red-100",
      textColor: "text-red-700",
    },
    {
      label: "Bloquées",
      value: blockedCount,
      icon: Ban,
      color: "orange",
      bg: "bg-orange-100",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mainMetrics.map((metric, index) => (
          <div key={index} className={`${metric.bg} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className={`h-8 w-8 rounded-lg ${metric.iconBg} flex items-center justify-center`}>
                  <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                </div>
                {metric.showProgress && (
                  <div className={`text-xs font-bold ${metric.textColor} bg-white/70 px-2 py-0.5 rounded-full`}>
                    {completionRate}%
                  </div>
                )}
              </div>
              <div className={`text-xl font-bold ${metric.textColor} mb-0.5`}>
                {metric.value}
              </div>
              <div className="text-xs font-medium text-slate-600">
                {metric.label}
              </div>
              {metric.showProgress && (
                <div className="mt-2">
                  <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.color === "indigo"
                          ? "bg-gradient-to-r from-indigo-500 to-indigo-700"
                          : metric.color === "blue"
                          ? "bg-gradient-to-r from-blue-500 to-blue-700"
                          : metric.color === "emerald"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-700"
                          : "bg-gradient-to-r from-purple-500 to-purple-700"
                      }`}
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Métriques d'urgence - Style compact */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Vue d'ensemble</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {urgencyMetrics.map((metric, index) => (
            <div
              key={index}
              className={`${metric.bg} rounded-lg p-2.5`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <metric.icon className={`h-3.5 w-3.5 ${metric.textColor}`} />
                <div className="text-xs font-medium text-slate-600">{metric.label}</div>
              </div>
              <div className={`text-lg font-bold ${metric.textColor}`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

