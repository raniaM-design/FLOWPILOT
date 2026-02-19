import { SectionTitle } from "@/components/ui/section-title";
import { CheckSquare2, Users, MessageSquare, Clock } from "lucide-react";
import { formatShortDate } from "@/lib/timeUrgency";
import Link from "next/link";

interface ActivityItem {
  id: string;
  type: "meeting" | "decision" | "action";
  title: string;
  date: Date;
  href?: string;
}

interface ProjectActivityProps {
  items: ActivityItem[];
  projectId: string;
}

export function ProjectActivity({ items, projectId }: ProjectActivityProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "meeting":
        return <Users className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />;
      case "decision":
        return <MessageSquare className="h-4 w-4" style={{ color: 'hsl(var(--accent-decisions))' }} />;
      case "action":
        return <CheckSquare2 className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />;
    }
  };

  const getActivityLabel = (type: ActivityItem["type"]) => {
    switch (type) {
      case "meeting":
        return "Réunion analysée";
      case "decision":
        return "Décision créée";
      case "action":
        return "Action terminée";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
      <div className="p-6 space-y-5">
        <SectionTitle
          title="Activité récente"
          subtitle="Événements récents du projet"
          size="md"
          accentColor="neutral"
          icon={<Clock className="h-4 w-4" />}
        />
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-100 dark:bg-slate-800/60">
              <Clock className="h-6 w-6 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Aucune activité récente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={item.href || "#"}
                className="block group"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-transparent hover:bg-slate-100/90 dark:hover:bg-slate-800/60 hover:border-slate-200/80 dark:hover:border-slate-700/50 hover:shadow-sm transition-all duration-200 ease-out">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-200/60 dark:bg-slate-700/50">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-[hsl(var(--brand))] transition-colors line-clamp-1 mb-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getActivityLabel(item.type)} • {formatShortDate(item.date)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

