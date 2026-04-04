import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";

/**
 * Après création d’une action : notifie l’assigné si ce n’est pas le créateur.
 */
export async function notifyActionAssigned(params: {
  actionId: string;
  actorUserId: string;
}): Promise<void> {
  const action = await prisma.actionItem.findUnique({
    where: { id: params.actionId },
    select: {
      assigneeId: true,
      title: true,
      decisionId: true,
    },
  });

  if (!action?.assigneeId || action.assigneeId === params.actorUserId) return;

  const assigneePrefs = await prisma.user.findUnique({
    where: { id: action.assigneeId },
    select: { notifyImmediateAssignEnabled: true },
  });
  if (assigneePrefs?.notifyImmediateAssignEnabled === false) return;

  const targetUrl = action.decisionId
    ? `/app/decisions/${action.decisionId}`
    : "/app/actions";

  await createNotification({
    userId: action.assigneeId,
    kind: "action_assigned",
    priority: "high",
    title: "Action assignée",
    body: `« ${action.title} » t’a été assignée.`,
    targetUrl,
    dedupeKey: `action_assigned:${params.actionId}:${action.assigneeId}`,
  });
}

/**
 * Quand une action passe en Bloquée : assigné (si ≠ acteur) + utilisateurs mentionnés (≠ acteur).
 */
export async function notifyActionBlockedForFollowers(params: {
  actionId: string;
  actorUserId: string;
}): Promise<void> {
  const action = await prisma.actionItem.findUnique({
    where: { id: params.actionId },
    select: {
      title: true,
      assigneeId: true,
      blockReason: true,
      decisionId: true,
      mentions: { select: { userId: true } },
    },
  });

  if (!action) return;

  const targetUrl = action.decisionId
    ? `/app/decisions/${action.decisionId}`
    : "/app/actions";

  const recipientIds = new Set<string>();
  if (action.assigneeId && action.assigneeId !== params.actorUserId) {
    recipientIds.add(action.assigneeId);
  }
  for (const m of action.mentions) {
    if (m.userId !== params.actorUserId) recipientIds.add(m.userId);
  }

  if (recipientIds.size === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: [...recipientIds] } },
    select: { id: true, notifyImmediateBlockedEnabled: true },
  });

  const bodyTail = action.blockReason?.trim()
    ? ` Motif : ${action.blockReason.trim()}`
    : "";

  for (const u of users) {
    if (u.notifyImmediateBlockedEnabled === false) continue;
    await createNotification({
      userId: u.id,
      kind: "action_blocked",
      priority: "high",
      title: "Action bloquée",
      body: `« ${action.title} » est passée en Bloquée.${bodyTail}`,
      targetUrl,
      dedupeKey: `action_blocked:${params.actionId}:${u.id}`,
    });
  }
}
