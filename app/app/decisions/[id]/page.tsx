import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { SectionTitle } from "@/components/ui/section-title";
import { DecisionHeader } from "@/components/decisions/decision-header";
import { DecisionSummaryCard } from "@/components/decisions/decision-summary-card";
import { ActionRow } from "@/components/decisions/action-row";
import { DecisionTimeline } from "@/components/decisions/decision-timeline";
import { DecisionActionForm } from "./decision-action-form";
import { calculateDecisionMeta } from "@/lib/decisions/decision-meta";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { Sparkles } from "lucide-react";
import { InviteCollaborator } from "@/components/collaboration/invite-collaborator";
import { CollaboratorsList } from "@/components/collaboration/collaborators-list";
import { canAccessProject } from "@/lib/company/getCompanyProjects";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Charger la décision avec le projet, les actions et le créateur
  const decision = await prisma.decision.findFirst({
    where: {
      id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          email: true,
        },
      },
      actions: {
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!decision) {
    notFound();
  }

  // Vérifier l'accès au projet
  const hasAccess = await canAccessProject(userId, decision.project.id);
  if (!hasAccess) {
    notFound();
  }

  // Calculer les métadonnées de la décision
  const meta = calculateDecisionMeta(decision);

  // Calculer les stats des actions
  const actionStats = {
    open: decision.actions.filter((a: typeof decision.actions[0]) => a.status !== "DONE").length,
    done: decision.actions.filter((a: typeof decision.actions[0]) => a.status === "DONE").length,
    blocked: decision.actions.filter((a: typeof decision.actions[0]) => a.status === "BLOCKED").length,
  };

  // Trier les actions : overdue d'abord, puis soon, puis le reste
  const sortedActions = [...decision.actions].sort((a, b) => {
    const aOverdue = isOverdue(a.dueDate, a.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    const bOverdue = isOverdue(b.dueDate, b.status as "TODO" | "DOING" | "DONE" | "BLOCKED");
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    const aDueMeta = getDueMeta(a.dueDate);
    const bDueMeta = getDueMeta(b.dueDate);
    
    // Soon (THIS_WEEK, SOON) avant le reste
    if ((aDueMeta.kind === "THIS_WEEK" || aDueMeta.kind === "SOON") && 
        !(bDueMeta.kind === "THIS_WEEK" || bDueMeta.kind === "SOON")) return -1;
    if (!(aDueMeta.kind === "THIS_WEEK" || aDueMeta.kind === "SOON") && 
        (bDueMeta.kind === "THIS_WEEK" || bDueMeta.kind === "SOON")) return 1;
    
    return 0;
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* PageHeader avec chips */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DecisionHeader
                decision={decision}
                meta={{
                  ...meta,
                  actionStats,
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <InviteCollaborator entityType="decision" entityId={decision.id} />
              <CollaboratorsList entityType="decision" entityId={decision.id} />
            </div>
          </div>

          {/* Bloc "Résumé" */}
          <DecisionSummaryCard
            context={decision.context}
            decision={decision.decision}
            decisionId={decision.id}
          />

          {/* Bloc "Actions liées" */}
          <FlowCard variant="default" className="bg-white border-slate-200/60 shadow-sm">
            <FlowCardHeader>
              <div className="flex items-center justify-between">
                <SectionTitle
                  title="Actions liées"
                  subtitle="Les actions concrètes découlant de cette décision"
                  count={decision.actions.length}
                  size="md"
                />
              </div>
            </FlowCardHeader>
            <FlowCardContent className="space-y-6">
              {sortedActions.length === 0 ? (
                <div className="py-16 text-center">
                  <Sparkles className="h-14 w-14 text-blue-500 mx-auto mb-4" />
                  <p className="text-base font-semibold text-slate-900 mb-2">
                    Aucune action liée
                  </p>
                  <p className="text-sm text-slate-600">
                    Créez une première action pour commencer l'exécution de cette décision
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedActions.map((action) => (
                    <ActionRow key={action.id} action={action} />
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout d'action */}
              <div id="new-action-form" className="pt-6 border-t border-slate-200/60">
                <DecisionActionForm decisionId={decision.id} />
              </div>
            </FlowCardContent>
          </FlowCard>

          {/* Bloc "Timeline / Traçabilité" */}
          <DecisionTimeline
            createdAt={decision.createdAt}
            createdBy={decision.createdBy}
          />
        </div>
      </div>
    </div>
  );
}
