/** Décisions sans aucune action depuis au moins ce nombre de jours (date de création). */
export const STALE_NO_ACTIONS_DAYS = 7;

/** Seuil d'affichage de l'alerte : part des décisions concernées (strictement >). */
export const NO_ACTIONS_ALERT_RATIO = 0.3;

export function staleNoActionsThresholdDate(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - STALE_NO_ACTIONS_DAYS);
  return d;
}

export function isStaleDecisionWithoutActions(decision: {
  createdAt: Date;
  actions?: unknown[] | { length: number };
  /** Alternative Prisma `_count.actions` pour éviter de charger les actions */
  actionCount?: number;
}): boolean {
  let n = 0;
  if (typeof decision.actionCount === "number") n = decision.actionCount;
  else if (Array.isArray(decision.actions)) n = decision.actions.length;
  else if (decision.actions && typeof (decision.actions as { length: number }).length === "number") {
    n = (decision.actions as { length: number }).length;
  }
  if (n > 0) return false;
  const created = new Date(decision.createdAt);
  created.setHours(0, 0, 0, 0);
  return created <= staleNoActionsThresholdDate();
}

export function countStaleDecisionsWithoutActions<
  T extends { createdAt: Date; actions?: unknown[] | { length: number }; actionCount?: number },
>(decisions: T[]): number {
  return decisions.filter((d) => isStaleDecisionWithoutActions(d)).length;
}

export function shouldShowNoActionsAlert(totalDecisions: number, staleCount: number): boolean {
  if (totalDecisions <= 0) return false;
  return staleCount / totalDecisions > NO_ACTIONS_ALERT_RATIO;
}
