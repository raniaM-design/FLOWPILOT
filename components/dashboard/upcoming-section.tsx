"use client";

import Link from "next/link";
import { Calendar, FolderKanban, ArrowRight, ListTodo } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";

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
 * Section « À venir (7 jours) »
 */
export function UpcomingSection({ actions }: UpcomingSectionProps) {
  const t = useTranslations("dashboard.upcoming");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const header = (
    <div className="flex items-center justify-between border-b border-slate-100 p-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
      </div>
      <Link
        href="/app/calendar"
        className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
      >
        {t("seeCalendar")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  if (actions.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {header}
        <EmptyState
          embedded
          icon={ListTodo}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          ctaLabel={t("emptyCta")}
          ctaAction="/app/actions?tab=blocked"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-sm">
      {header}
      <div className="divide-y divide-slate-100">
        {actions.slice(0, 5).map((action) => (
          <Link
            key={action.id}
            href={`/app/projects/${action.projectId}?actionId=${action.id}`}
            className="block p-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="mb-1.5 text-sm font-semibold text-slate-900">
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
                        {new Date(action.dueDate).toLocaleDateString(
                          dateLocale,
                          {
                            day: "numeric",
                            month: "long",
                          }
                        )}
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
