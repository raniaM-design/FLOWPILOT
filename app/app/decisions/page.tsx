import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { calculateDecisionMeta } from "@/lib/decisions/decision-meta";
import { getTranslations } from "@/i18n/request";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { DecisionsListEnhanced } from "@/components/decisions/decisions-list-enhanced";
import { getAccessibleProjectsWhere } from "@/lib/company/getCompanyProjects";

export default async function DecisionsPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  const projectsWhere = await getAccessibleProjectsWhere(userId);

  // Récupérer les IDs des décisions où l'utilisateur est mentionné
  const mentionedDecisionIds = await (prisma as any).decisionMention.findMany({
    where: {
      userId,
    },
    select: {
      decisionId: true,
    },
  }).then((mentions: any[]) => mentions.map((m: any) => m.decisionId));

  // Récupérer TOUTES les décisions accessibles à l'utilisateur connecté :
  // - Décisions des projets accessibles
  // - OU décisions où l'utilisateur est mentionné
  const decisions = await (prisma as any).decision.findMany({
    where: {
      OR: [
        {
          project: projectsWhere,
        },
        ...(mentionedDecisionIds.length > 0
          ? [
              {
                id: {
                  in: mentionedDecisionIds,
                },
              },
            ]
          : []),
      ],
      // Pas de filtre sur status, projectId, etc. - on veut TOUTES les décisions
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      actions: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Plus récentes en premier
    },
  });

  // Calculer les métadonnées pour chaque décision
  type DecisionWithActions = (typeof decisions)[0];
  const decisionsWithMeta = decisions.map((decision: DecisionWithActions) => ({
    decision,
    meta: calculateDecisionMeta(decision),
  }));

  /**
   * Helper pour obtenir le variant Chip du statut de décision
   */
  function getDecisionStatusChipVariant(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
    switch (status) {
      case "DRAFT":
        return "neutral";
      case "DECIDED":
        return "success";
      case "ARCHIVED":
        return "neutral";
      default:
        return "neutral";
    }
  }

  /**
   * Helper pour obtenir le label du statut de décision
   */
  function getDecisionStatusLabel(status: string): string {
    switch (status) {
      case "DRAFT":
        return "Brouillon";
      case "DECIDED":
        return "Décidée";
      case "ARCHIVED":
        return "Archivée";
      default:
        return status;
    }
  }

  /**
   * Helper pour obtenir la couleur du badge selon le statut et le risque
   */
  function getStatusBadgeStyle(status: string, riskLevel: string) {
    // Si risque RED ou YELLOW, on affiche "À surveiller" en orange
    if (riskLevel === "RED" || riskLevel === "YELLOW") {
      return {
        variant: "warning" as const,
        className: "",
        label: "À surveiller",
      };
    }
    
    // Sinon, on affiche le statut normal
    switch (status) {
      case "DRAFT":
        return {
          variant: "neutral" as const,
          className: "",
          label: "Brouillon",
        };
      case "DECIDED":
        return {
          variant: "success" as const,
          className: "",
          label: "Décidée",
        };
      case "ARCHIVED":
        return {
          variant: "neutral" as const,
          className: "",
          label: "Archivée",
        };
      default:
        return {
          variant: "neutral" as const,
          className: "",
          label: status,
        };
    }
  }

  /**
   * Helper pour formater la date de création
   */
  function formatDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const decisionDate = new Date(date);
    decisionDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - decisionDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    }
    if (diffDays === 1) {
      return "Hier";
    }
    if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    }
    
    return decisionDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: decisionDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec titre et bouton */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-semibold text-[#111111] leading-tight mb-3">
            Décisions
          </h1>
          <p className="text-base text-[#667085] leading-relaxed">
            Documentez et suivez vos décisions importantes pour transformer vos choix en actions concrètes
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/app/decisions/new">
            <Button 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle décision
            </Button>
          </Link>
        </div>
      </div>

      {/* Liste des décisions avec filtres */}
      {decisionsWithMeta.length === 0 ? (
        <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
          <FlowCardContent className="p-16 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB]">
                  <Sparkles className="h-10 w-10 text-[#2563EB]" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#111111] tracking-tight">
                  {t("emptyStates.noDecisions")}
                </h3>
                <p className="text-[#667085] leading-relaxed">
                  {t("decisions.noDecisionsMessage")}
                </p>
              </div>
              <Link href="/app/decisions/new">
                <Button 
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 h-auto font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t("decisions.createFirst")}
                </Button>
              </Link>
            </div>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <DecisionsListEnhanced 
          decisions={decisionsWithMeta.map(({ decision, meta }) => ({
            id: decision.id,
            title: decision.title,
            status: decision.status,
            createdAt: decision.createdAt.toISOString(),
            project: decision.project,
            actions: decision.actions.map((action) => ({
              id: action.id,
              status: action.status,
              dueDate: action.dueDate ? action.dueDate.toISOString() : null,
            })),
            meta: {
              risk: {
                level: meta.risk.level,
                reason: meta.risk.reason || "",
              },
              actionCount: meta.actionCount,
              nextDueDate: meta.nextDueDate ? new Date(meta.nextDueDate) : null,
            },
          }))}
        />
      )}
    </div>
  );
}
