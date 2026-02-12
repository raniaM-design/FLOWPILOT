/**
 * Helper pour calculer le niveau de risque d'une décision (server-only)
 */

export type DecisionRiskLevel = "RED" | "YELLOW" | "GREEN";

export interface DecisionRisk {
  level: DecisionRiskLevel;
  label: string;
}

interface ActionItem {
  id: string;
  status: string;
  dueDate: Date | null;
}

/**
 * Calcule le niveau de risque d'une décision basé sur ses actions
 * 
 * Règles :
 * - RED : au moins 1 action BLOCKED OU au moins 1 action en retard OU décision non exécutable (0 action OU action sans dueDate)
 * - YELLOW : pas RED mais 0 action DONE
 * - GREEN : sinon
 */
export function calculateDecisionRisk(actions: ActionItem[]): DecisionRisk {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Vérifier si au moins une action est BLOCKED
  const hasBlockedAction = actions.some((action) => action.status === "BLOCKED");

  // Vérifier si au moins une action est en retard (dueDate < now && status != DONE)
  const hasOverdueAction = actions.some((action) => {
    if (!action.dueDate || action.status === "DONE") {
      return false;
    }
    const dueDate = new Date(action.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  });

  // Vérifier si la décision est non exécutable (0 action OU action sans dueDate)
  const hasNoActions = actions.length === 0;
  const hasActionsWithoutDueDate = actions.some((action) => !action.dueDate);
  const isNotExecutable = hasNoActions || hasActionsWithoutDueDate;

  // RED : au moins une condition critique (sans action, bloquée, en retard)
  if (hasBlockedAction || hasOverdueAction || isNotExecutable) {
    return {
      level: "RED",
      label: "Critique",
    };
  }

  // Vérifier si au moins une action est DONE
  const hasDoneAction = actions.some((action) => action.status === "DONE");

  // YELLOW : pas RED mais aucune action DONE
  if (!hasDoneAction) {
    return {
      level: "YELLOW",
      label: "Fragile",
    };
  }

  // GREEN : sinon
  return {
    level: "GREEN",
    label: "Sous contrôle",
  };
}

