/**
 * Service pour créer des notifications
 * Gère la déduplication automatique
 */

import { prisma } from "@/lib/db";

export type NotificationKind =
  | "action_assigned"
  | "deadline_soon"
  | "overdue"
  | "mention"
  | "comment"
  | "import_done"
  | "import_failed"
  | "export_ready"
  | "security_alert"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface CreateNotificationParams {
  userId: string;
  kind: NotificationKind;
  priority?: NotificationPriority;
  title: string;
  body?: string;
  targetUrl?: string;
  dedupeKey?: string; // Si fourni, évite les doublons (24h)
}

/**
 * Crée une notification avec déduplication automatique
 * Si dedupeKey existe et qu'une notification non lue récente (24h) existe, met à jour createdAt au lieu de créer
 */
export async function createNotification({
  userId,
  kind,
  priority = "normal",
  title,
  body,
  targetUrl,
  dedupeKey,
}: CreateNotificationParams): Promise<{ id: string; created: boolean }> {
  // Si dedupeKey fourni, vérifier s'il existe déjà une notification non lue récente (24h)
  if (dedupeKey) {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        dedupeKey,
        isRead: false,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existing) {
      // Mettre à jour createdAt pour "rafraîchir" la notification
      await prisma.notification.update({
        where: { id: existing.id },
        data: {
          createdAt: new Date(),
          // Mettre à jour aussi le contenu si nécessaire
          title,
          body,
          targetUrl,
          priority,
        },
      });
      return { id: existing.id, created: false };
    }
  }

  // Créer une nouvelle notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      kind,
      priority,
      title,
      body,
      targetUrl,
      dedupeKey,
    },
  });

  return { id: notification.id, created: true };
}

