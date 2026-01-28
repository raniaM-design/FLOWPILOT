import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { ActionStatusWrapper } from "@/components/action-status-wrapper";
import { ActionStatusButtons } from "@/components/action-status-buttons";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { FolderKanban, Calendar, Sparkles, Target, ArrowRight, AlertCircle, AlertTriangle, CheckSquare, Zap } from "lucide-react";

interface FocusTodayProps {
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
 * Bloc "Action principale du jour" - Coach silencieux
 * Met en avant UNE action principale pour réduire la charge mentale
 */
export function FocusToday({ actions }: FocusTodayProps) {
  // La première action est la priorité absolue
  const mainAction = actions.length > 0 ? actions[0] : null;
  const otherActions = actions.slice(1, 3);

  if (!mainAction) {
    return (
      <FlowCard variant="default">
        <FlowCardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent) / 0.4)' }}>
              <Sparkles className="h-8 w-8" style={{ color: 'hsl(var(--primary) / 0.8)' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-normal text-text-secondary leading-relaxed max-w-md">
              Aucune action prioritaire aujourd'hui. Vous pouvez avancer sereinement.
            </p>
          </div>
        </FlowCardContent>
      </FlowCard>
    );
  }

  const dueMeta = getDueMeta(mainAction.dueDate);
  const overdue = isOverdue(mainAction.dueDate, mainAction.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
  const isBlocked = mainAction.status === "BLOCKED";

  return (
    <div className="space-y-6">
      {/* Action principale - Mise en avant avec design amélioré */}
      <FlowCard variant="elevated">
        <FlowCardContent className="p-8">
          {/* Header avec icône grande et visible */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--accent) / 0.5)' }}>
                <Zap className="h-7 w-7" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-medium text-foreground tracking-tight">
                    Action du jour
                  </h3>
                  {overdue && (
                    <Chip variant="danger" size="sm" className="font-normal">
                      Urgent
                    </Chip>
                  )}
                  {isBlocked && (
                    <Chip variant="warning" size="sm" className="font-normal">
                      Bloquée
                    </Chip>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {overdue 
                    ? "Cette action nécessite votre attention. Prenez le temps de la traiter sereinement."
                    : isBlocked
                    ? "Cette action est bloquée. Identifiez ce qui la bloque pour avancer."
                    : "Commencez par celle-ci. Une seule chose à la fois, vous y arriverez."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action principale - Carte élégante */}
          <Link
            href={`/app/projects/${mainAction.projectId}?actionId=${mainAction.id}`}
            className="block group"
          >
            <div className="flex items-start justify-between gap-6 p-6 rounded-2xl bg-section-bg/40 hover:bg-hover-bg/70 transition-all duration-200 ease-out">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: 'hsl(var(--accent) / 0.6)' }}>
                    <CheckSquare className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-foreground leading-relaxed group-hover:text-primary transition-colors duration-200 ease-out mb-3">
                      {mainAction.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 font-normal">
                        <FolderKanban className="h-4 w-4" />
                        <span>{mainAction.project.name}</span>
                      </span>
                      {mainAction.dueDate && (
                        <>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-2 font-normal">
                            <Calendar className="h-4 w-4" />
                            {new Date(mainAction.dueDate).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <ActionStatusWrapper>
                <ActionStatusButtons
                  actionId={mainAction.id}
                  currentStatus={mainAction.status as "TODO" | "DOING" | "DONE" | "BLOCKED"}
                />
              </ActionStatusWrapper>
            </div>
          </Link>
        </FlowCardContent>
      </FlowCard>

      {/* Autres actions prioritaires (si présentes) - Design plus discret */}
      {otherActions.length > 0 && (
        <FlowCard variant="default">
          <FlowCardContent className="space-y-3">
            {otherActions.map((action) => {
              const actionDueMeta = getDueMeta(action.dueDate);
              const actionOverdue = isOverdue(action.dueDate, action.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
              const actionIsBlocked = action.status === "BLOCKED";

              return (
                <Link
                  key={action.id}
                  href={`/app/projects/${action.projectId}?actionId=${action.id}`}
                  className="block group"
                >
                  <div className="flex items-start justify-between gap-5 p-4 rounded-xl bg-section-bg/20 hover:bg-hover-bg/80 transition-all duration-200 ease-out">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(var(--accent) / 0.5)' }}>
                          <CheckSquare className="h-3 w-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors duration-150 ease-out">
                              {action.title}
                            </h5>
                            {actionOverdue && (
                              <Chip variant="danger" size="sm">
                                En retard
                              </Chip>
                            )}
                            {actionIsBlocked && (
                              <Chip variant="warning" size="sm">
                                Bloquée
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pl-7">
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
                </Link>
              );
            })}
          </FlowCardContent>
        </FlowCard>
      )}
    </div>
  );
}
