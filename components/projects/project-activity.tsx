import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
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
    <FlowCard variant="default">
      <FlowCardContent className="space-y-5">
        <SectionTitle
          title="Activité récente"
          subtitle="Événements récents du projet"
          size="md"
          accentColor="neutral"
          icon={<Clock className="h-4 w-4" />}
        />
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'hsl(var(--accent) / 0.3)' }}>
              <Clock className="h-7 w-7" style={{ color: 'hsl(var(--primary) / 0.7)' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-normal text-text-secondary leading-relaxed max-w-md mx-auto">
              Aucune activité récente. Les événements du projet apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={item.href || "#"}
                className="block group"
              >
                <div className="flex items-start gap-4 p-5 rounded-xl bg-section-bg/50 hover:bg-hover-bg/90 transition-all duration-200 ease-out border border-transparent hover:border-border/50">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent) / 0.3)' }}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-150 ease-out line-clamp-1 mb-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {getActivityLabel(item.type)} • {formatShortDate(item.date)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </FlowCardContent>
    </FlowCard>
  );
}

