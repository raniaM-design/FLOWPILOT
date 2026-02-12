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
import { getDecisionThresholds } from "@/lib/decisions/decision-thresholds";
import { getDueMeta, isOverdue } from "@/lib/timeUrgency";
import { Sparkles } from "lucide-react";
import { CollaborationSection } from "@/components/collaboration/collaboration-section";
import { canAccessProject } from "@/lib/company/getCompanyProjects";
import { DecisionMentionsEditor } from "@/components/decisions/decision-mentions-editor";
import { CommentsSection } from "@/components/comments/comments-section";

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

  // Vérifier l'accès au projet OU si l'utilisateur est mentionné sur cette décision
  const hasProjectAccess = await canAccessProject(userId, decision.project.id);
  
  // Vérifier si l'utilisateur est mentionné sur cette décision
  const isMentioned = await (prisma as any).decisionMention.findFirst({
    where: {
      decisionId: decision.id,
      userId,
    },
  });

  if (!hasProjectAccess && !isMentioned) {
    notFound();
  }

  // Calculer les métadonnées de la décision (avec seuils personnalisés)
  const decisionThresholds = await getDecisionThresholds(userId);
  const meta = calculateDecisionMeta(decision, decisionThresholds);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="space-y-8 lg:space-y-10">
          {/* PageHeader avec chips - Section principale améliorée */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/10 p-6 lg:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/20">
                <DecisionHeader
                  decision={decision}
                  meta={{
                    ...meta,
                    actionStats,
                  }}
                />
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4 lg:space-y-5">
              <div className="sticky top-8 space-y-4 lg:space-y-5">
                <DecisionMentionsEditor decisionId={decision.id} />
                <CollaborationSection entityType="decision" entityId={decision.id} />
                <CommentsSection entityType="decision" entityId={decision.id} />
              </div>
            </div>
          </div>

          {/* Bloc "Résumé" - Amélioré avec ombre et gradient */}
          <div className="transform transition-all duration-300 hover:shadow-lg">
            <DecisionSummaryCard
              context={decision.context}
              decision={decision.decision}
              decisionId={decision.id}
            />
          </div>

          {/* Bloc "Actions liées" - Design amélioré */}
          <FlowCard variant="default" className="bg-white border-slate-200/80 shadow-lg shadow-slate-200/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/20">
            <FlowCardHeader className="bg-gradient-to-r from-blue-50/60 via-white to-blue-50/30 border-b border-slate-200/60 px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <SectionTitle
                  title="Actions liées"
                  subtitle="Les actions concrètes découlant de cette décision"
                  count={decision.actions.length}
                  size="md"
                />
              </div>
            </FlowCardHeader>
            <FlowCardContent className="p-6 lg:p-8 space-y-6">
              {sortedActions.length === 0 ? (
                <div className="py-20 text-center bg-gradient-to-br from-slate-50/80 to-blue-50/30 rounded-xl border-2 border-dashed border-slate-200/60">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 mb-4 shadow-md">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-2">
                    Aucune action liée
                  </p>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Créez une première action pour commencer l'exécution de cette décision
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedActions.map((action, index) => (
                    <div 
                      key={action.id}
                      className="transform transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ActionRow action={action} />
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout d'action - Amélioré */}
              <div id="new-action-form" className="pt-6 mt-6 border-t border-slate-200/60 bg-gradient-to-br from-slate-50/60 to-transparent rounded-xl p-5 -mx-2">
                <DecisionActionForm decisionId={decision.id} />
              </div>
            </FlowCardContent>
          </FlowCard>

          {/* Bloc "Timeline / Traçabilité" - Amélioré */}
          <div className="transform transition-all duration-300">
            <DecisionTimeline
              createdAt={decision.createdAt}
              createdBy={decision.createdBy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
