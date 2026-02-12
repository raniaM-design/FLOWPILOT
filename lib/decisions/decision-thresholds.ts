/**
 * Seuils personnalisables pour les états des décisions (server-only)
 */

import { prisma } from "@/lib/db";

export const DEFAULT_CRITICAL_DAYS = 3;
export const DEFAULT_MONITOR_DAYS = 10;

export interface DecisionThresholds {
  criticalDays: number;
  monitorDays: number;
}

/**
 * Récupère les seuils de l'utilisateur (ou les valeurs par défaut)
 */
export async function getDecisionThresholds(userId: string | null): Promise<DecisionThresholds> {
  if (!userId) {
    return { criticalDays: DEFAULT_CRITICAL_DAYS, monitorDays: DEFAULT_MONITOR_DAYS };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { decisionCriticalDays: true, decisionMonitorDays: true },
  });

  const criticalDays = user?.decisionCriticalDays ?? DEFAULT_CRITICAL_DAYS;
  const monitorDays = user?.decisionMonitorDays ?? DEFAULT_MONITOR_DAYS;

  // S'assurer que monitorDays >= criticalDays
  return {
    criticalDays,
    monitorDays: Math.max(monitorDays, criticalDays),
  };
}
