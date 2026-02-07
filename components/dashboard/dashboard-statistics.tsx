"use client";

import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { CheckSquare, TrendingUp, Clock, Target, AlertCircle, Ban, Calendar, Zap } from "lucide-react";

interface DashboardStatisticsProps {
  totalActions: number;
  completedActions: number;
  overdueCount: number;
  blockedCount: number;
  weekCount: number;
  todayCount: number;
}

/**
 * Composant de statistiques du dashboard - Design professionnel avec métriques visuelles
 */
export function DashboardStatistics({
  totalActions,
  completedActions,
  overdueCount,
  blockedCount,
  weekCount,
  todayCount,
}: DashboardStatisticsProps) {
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const activeActions = totalActions - completedActions;
  const healthScore = totalActions > 0 
    ? Math.max(0, Math.round(100 - (overdueCount * 20) - (blockedCount * 10)))
    : 100;

  const stats = [
    {
      label: "Actions totales",
      value: totalActions,
      icon: Target,
      color: "blue",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-700",
    },
    {
      label: "Terminées",
      value: completedActions,
      icon: CheckSquare,
      color: "emerald",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
      percentage: completionRate,
    },
    {
      label: "En cours",
      value: activeActions,
      icon: Clock,
      color: "amber",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      textColor: "text-amber-700",
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

  const quickStats = [
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
    <div className="space-y-4">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <FlowCard key={index} variant="default" className={`${stat.bg} border-0 shadow-sm hover:shadow-md transition-shadow`}>
            <FlowCardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                {stat.percentage !== undefined && (
                  <span className={`text-xs font-bold ${stat.textColor} bg-white/60 px-2 py-1 rounded-full`}>
                    {stat.percentage}%
                  </span>
                )}
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${stat.textColor} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-600">
                {stat.label}
              </div>
              {stat.showProgress && (
                <div className="mt-3">
                  <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.color === "indigo" 
                          ? "bg-gradient-to-r from-indigo-400 to-indigo-600"
                          : stat.color === "blue"
                          ? "bg-gradient-to-r from-blue-400 to-blue-600"
                          : stat.color === "emerald"
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                          : "bg-gradient-to-r from-amber-400 to-amber-600"
                      }`}
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </FlowCardContent>
          </FlowCard>
        ))}
      </div>

      {/* Score de santé et stats rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score de santé */}
        <FlowCard variant="default" className="bg-gradient-to-br from-slate-50 to-slate-100 border-0 shadow-sm">
          <FlowCardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-600">Score de santé</div>
                  <div className={`text-2xl font-bold ${
                    healthScore >= 80 ? "text-emerald-600" :
                    healthScore >= 60 ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                    {healthScore}/100
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthScore >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                  healthScore >= 60 ? "bg-gradient-to-r from-amber-400 to-amber-600" :
                  "bg-gradient-to-r from-red-400 to-red-600"
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </FlowCardContent>
        </FlowCard>

        {/* Stats rapides */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bg} rounded-lg p-4 border-0 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
                <div className="text-xs font-medium text-slate-600">{stat.label}</div>
              </div>
              <div className={`text-xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

