"use client";

import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { FolderKanban, CheckSquare, TrendingUp } from "lucide-react";

interface SimpleStatisticsProps {
  activeProjects: number;
  tasksInProgress: number;
  averageProgress: number;
}

/**
 * Composant de statistiques simplifié - Style PILOTYS
 */
export function SimpleStatistics({
  activeProjects,
  tasksInProgress,
  averageProgress,
}: SimpleStatisticsProps) {
  const stats = [
    {
      label: "Projets actifs",
      value: activeProjects,
      icon: FolderKanban,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      circleBg: "bg-purple-500",
      textColor: "text-purple-700",
    },
    {
      label: "Tâches en cours",
      value: tasksInProgress,
      icon: CheckSquare,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      circleBg: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "Progression moyenne",
      value: `${averageProgress}%`,
      icon: TrendingUp,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      circleBg: "bg-indigo-500",
      textColor: "text-indigo-700",
    },
  ];

  return (
    <FlowCard variant="default" className="border-0 shadow-lg bg-white">
      <FlowCardContent className="p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Statistiques</h2>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className={`text-xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-600">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

