/**
 * Helpers pour calculer les métadonnées d'une décision (server-only)
 */

import { DecisionRisk, calculateDecisionRisk } from "@/lib/decision-risk";
import { DecisionCardMeta } from "@/components/decisions/decision-card";
import type { DecisionThresholds } from "./decision-thresholds";

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
 * État d'affichage basé sur la proximité de l'échéance et les seuils utilisateur
 * - critical : échéance < criticalDays
 * - to_monitor : criticalDays <= échéance < monitorDays
 * - ok : échéance >= monitorDays ou pas d'échéance
 */
function calculateDeadlineDisplayState(
  nextDueDate: Date | null,
  thresholds: DecisionThresholds
): DecisionCardMeta["deadlineDisplayState"] {
  if (!nextDueDate) return "ok";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < thresholds.criticalDays) return "critical";
  if (daysDiff < thresholds.monitorDays) return "to_monitor";
  return "ok";
}

/**
 * Calcule toutes les métadonnées nécessaires pour afficher une DecisionCard
 * @param decision - La décision avec ses actions
 * @param thresholds - Seuils personnalisés (sinon utilise les défauts: 3 et 10 jours)
 */
export function calculateDecisionMeta(
  decision: DecisionWithActions,
  thresholds?: DecisionThresholds
): DecisionCardMeta {
  const risk = calculateDecisionRisk(decision.actions);
  const actionCount = decision.actions.length;
  const nextDueDate = calculateNextDueDate(decision.actions);
  const effectiveThresholds = thresholds ?? {
    criticalDays: 3,
    monitorDays: 10,
  };
  const deadlineDisplayState = calculateDeadlineDisplayState(nextDueDate, effectiveThresholds);

  return {
    risk,
    actionCount,
    nextDueDate,
    deadlineDisplayState,
  };
}

/**
 * Calcule les métadonnées pour plusieurs décisions
 */
export function calculateDecisionsMeta(
  decisions: DecisionWithActions[],
  thresholds?: DecisionThresholds
): Array<{
  decision: DecisionWithActions;
  meta: DecisionCardMeta;
}> {
  return decisions.map((decision) => ({
    decision,
    meta: calculateDecisionMeta(decision, thresholds),
  }));
}

