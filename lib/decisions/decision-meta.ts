/**
 * Helpers pour calculer les métadonnées d'une décision (server-only)
 */

import { DecisionRisk, calculateDecisionRisk } from "@/lib/decision-risk";
import { isOverdue } from "@/lib/timeUrgency";
import { DecisionCardMeta } from "@/components/decisions/decision-card";

interface ActionItem {
  id: string;
  status: string;
  dueDate: Date | null;
}

interface DecisionWithActions {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  project: {
    id: string;
    name: string;
  };
  actions: ActionItem[];
}

/**
 * Calcule la prochaine échéance d'une décision (la plus proche parmi les actions non terminées)
 */
function calculateNextDueDate(actions: ActionItem[]): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Filtrer les actions non terminées avec une échéance
  const openActionsWithDueDate = actions
    .filter((action) => action.status !== "DONE" && action.dueDate !== null)
    .map((action) => new Date(action.dueDate!))
    .sort((a, b) => a.getTime() - b.getTime());

  if (openActionsWithDueDate.length === 0) {
    return null;
  }

  return openActionsWithDueDate[0];
}

/**
 * Calcule toutes les métadonnées nécessaires pour afficher une DecisionCard
 * Doit être appelé côté serveur avant de passer les props à DecisionCard
 */
export function calculateDecisionMeta(decision: DecisionWithActions): DecisionCardMeta {
  const risk = calculateDecisionRisk(decision.actions);
  const actionCount = decision.actions.length;
  const nextDueDate = calculateNextDueDate(decision.actions);

  return {
    risk,
    actionCount,
    nextDueDate,
  };
}

/**
 * Calcule les métadonnées pour plusieurs décisions
 */
export function calculateDecisionsMeta(decisions: DecisionWithActions[]): Array<{
  decision: DecisionWithActions;
  meta: DecisionCardMeta;
}> {
  return decisions.map((decision) => ({
    decision,
    meta: calculateDecisionMeta(decision),
  }));
}

