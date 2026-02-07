"use client";

import Link from "next/link";
import { Calendar, FolderKanban, ArrowRight } from "lucide-react";

interface UpcomingAction {
  id: string;
  title: string;
  dueDate: Date | null;
  projectId: string;
  project: { id: string; name: string };
}

interface UpcomingSectionProps {
  actions: UpcomingAction[];
}

/**
 * Section "À venir (7 jours)" - Affichage léger
 */
export function UpcomingSection({ actions }: UpcomingSectionProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">À venir (7 jours)</h2>
          <p className="text-sm text-slate-600 mt-1">Planification de la semaine</p>
        </div>
        <Link
          href="/app/calendar"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
        >
          Voir le planning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {actions.slice(0, 5).map((action) => (
          <Link
            key={action.id}
            href={`/app/projects/${action.projectId}?actionId=${action.id}`}
            className="block p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-slate-900 mb-1.5">
                  {action.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    {action.project.name}
                  </span>
                  {action.dueDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(action.dueDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </>
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

