"use client";

import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { AlertCircle, Ban, Calendar, CheckSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActionsToTakeProps {
  overdueCount: number;
  blockedCount: number;
  weekCount: number;
  todayCount: number;
}

/**
 * Composant "Actions à mener" - Style PILOTYS avec cercles colorés et boutons
 */
export function ActionsToTake({
  overdueCount,
  blockedCount,
  weekCount,
  todayCount,
}: ActionsToTakeProps) {
  const actions = [
    {
      label: "Tâches en retard",
      count: overdueCount,
      color: "red",
      circleBg: "bg-red-500",
      textColor: "text-red-600",
      buttonText: "Voir les tâches",
      href: "/app/actions?filter=overdue",
      icon: AlertCircle,
    },
    {
      label: "Tâches bloquées",
      count: blockedCount,
      color: "orange",
      circleBg: "bg-orange-500",
      textColor: "text-orange-600",
      buttonText: "Débloquer les tâches",
      href: "/app/actions?filter=blocked",
      icon: Ban,
    },
    {
      label: "Tâches aujourd'hui",
      count: todayCount,
      color: "blue",
      circleBg: "bg-blue-500",
      textColor: "text-blue-600",
      buttonText: "Voir les tâches",
      href: "/app/actions?filter=today",
      icon: Calendar,
    },
    {
      label: "Tâches cette semaine",
      count: weekCount,
      color: "indigo",
      circleBg: "bg-indigo-500",
      textColor: "text-indigo-600",
      buttonText: "Planifier les tâches",
      href: "/app/actions?filter=week",
      icon: Calendar,
    },
  ].filter((action) => action.count > 0);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-5">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Actions à mener</h2>
      <div className="space-y-2.5">
        {actions.map((action, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-12 h-12 rounded-full ${action.circleBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white font-bold text-lg">{action.count}</span>
              </div>
              <div className={`font-bold text-sm ${action.textColor}`}>
                {action.count} {action.label}
              </div>
            </div>
            <Link
              href={action.href}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 hover:shadow-sm ${
                action.color === "red"
                  ? "text-red-600 bg-red-50 hover:bg-red-100"
                  : action.color === "orange"
                  ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                  : action.color === "blue"
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              }`}
            >
              {action.buttonText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

