import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { SectionTitle } from "@/components/ui/section-title";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { FolderKanban, Calendar, Sparkles, AlertCircle, CheckSquare } from "lucide-react";
import { getActionStatusBadgeVariant, getActionStatusLabel } from "@/lib/utils/action-status";

interface WeekActionsProps {
  actions: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    projectId: string;
    project: { id: string; name: string };
    decisionId: string | null;
    decision: { id: string } | null;
  }>;
}

/**
 * Section "Actions de la semaine" - Design léger et moderne
 * Coach silencieux : wording guidant et rassurant
 */
export function WeekActions({ actions }: WeekActionsProps) {
  if (actions.length === 0) {
    return (
      <FlowCard variant="default">
        <FlowCardContent className="py-12 text-center">
          <p className="text-sm font-normal text-[#475569] leading-relaxed">
            Aucune action prévue cette semaine. Vous pouvez vous concentrer sur vos priorités du jour.
          </p>
        </FlowCardContent>
      </FlowCard>
    );
  }

  return (
    <FlowCard variant="default">
      <FlowCardContent className="space-y-5">
        <SectionTitle
          title="Actions de la semaine"
          subtitle="Ces actions sont prévues dans les 7 prochains jours. Vous avez le temps de les planifier."
          count={actions.length}
          size="md"
          accentColor="blue"
          icon={<Calendar className="h-4 w-4" />}
        />
        <div className="space-y-3">
          {actions.map((action) => {
            const dueMeta = getDueMeta(action.dueDate);
            const overdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
            
            return (
              <Link
                key={action.id}
                href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                className="block group"
              >
                <div className="bg-section-bg/50 rounded-xl shadow-premium p-5 hover:bg-hover-bg transition-all duration-150 ease-out dark:shadow-none">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--accent) / 0.5)' }}>
                          <CheckSquare className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-150 ease-out">
                              {action.title}
                            </h4>
                            {dueMeta.kind === "TODAY" && (
                              <Chip variant="info" size="sm">
                                Aujourd'hui
                              </Chip>
                            )}
                            {dueMeta.kind === "THIS_WEEK" && (
                              <Chip variant="info" size="sm">
                                Cette semaine
                              </Chip>
                            )}
                            {overdue && (
                              <Chip variant="danger" size="sm">
                                En retard
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pl-8">
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
                                month: "short",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ActionStatusWrapper>
                      <ActionStatusButtons
                        actionId={action.id}
                        currentStatus={action.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                      />
                    </ActionStatusWrapper>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}
