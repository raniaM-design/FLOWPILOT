import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { AlertCircle } from "lucide-react";
import { calculateDecisionRisk } from "@/lib/decision-risk";
import { DecisionCard } from "@/components/decisions/decision-card";
import { calculateDecisionMeta } from "@/lib/decisions/decision-meta";
import { getDecisionThresholds } from "@/lib/decisions/decision-thresholds";

export default async function DecisionsRiskPage() {
  const userId = await getCurrentUserIdOrThrow();

  // Récupérer toutes les décisions de l'utilisateur avec leurs actions
  const decisions = await prisma.decision.findMany({
    where: {
      project: {
        ownerId: userId, // Sécurité : filtrer par ownerId
      },
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
          title: true,
          status: true,
          dueDate: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculer le risque pour chaque décision et filtrer celles en RED
  type DecisionWithRisk = (typeof decisions)[0] & { risk: ReturnType<typeof calculateDecisionRisk> };
  
  const riskyDecisions: DecisionWithRisk[] = decisions
    .map((decision: (typeof decisions)[0]) => {
      const risk = calculateDecisionRisk(decision.actions);
      return {
        ...decision,
        risk,
      };
    })
    .filter((decision: DecisionWithRisk): decision is DecisionWithRisk => decision.risk.level === "RED");

  // Helper pour générer le résumé des problèmes
  const getRiskSummary = (decision: {
    actions: Array<{ id: string; title: string; status: string; dueDate: Date | null }>;
  }) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const blockedActions = decision.actions.filter((action) => action.status === "BLOCKED");
    const overdueActions = decision.actions.filter((action) => {
      if (!action.dueDate || action.status === "DONE") {
        return false;
      }
      const dueDate = new Date(action.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    });
    const actionsWithoutDueDate = decision.actions.filter((action) => !action.dueDate);
    const hasNoActions = decision.actions.length === 0;

    const issues: string[] = [];

    if (hasNoActions) {
      issues.push("Aucune action liée");
    } else {
      if (blockedActions.length > 0) {
        issues.push(`${blockedActions.length} action${blockedActions.length > 1 ? "s" : ""} bloquée${blockedActions.length > 1 ? "s" : ""}`);
      }
      if (overdueActions.length > 0) {
        issues.push(`${overdueActions.length} action${overdueActions.length > 1 ? "s" : ""} en retard`);
      }
      if (actionsWithoutDueDate.length > 0) {
        issues.push(`${actionsWithoutDueDate.length} action${actionsWithoutDueDate.length > 1 ? "s" : ""} sans échéance`);
      }
    }

    return issues;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Décisions à surveiller</h1>
        <p className="text-muted-foreground mt-2">
          Ces décisions sont enregistrées mais rencontrent un problème d'exécution.
        </p>
      </div>

      {/* Liste des décisions à risque */}
      {riskyDecisions.length === 0 ? (
        <FlowCard variant="subtle">
          <FlowCardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-3 bg-muted rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Aucune décision critique pour le moment</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Toutes vos décisions sont sous contrôle ou n'ont pas encore de problèmes d'exécution.
            </p>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {riskyDecisions.map((decision: DecisionWithRisk) => {
            const meta = calculateDecisionMeta(decision, decisionThresholds);
            return (
              <DecisionCard
                key={decision.id}
                decision={decision}
                meta={meta}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

