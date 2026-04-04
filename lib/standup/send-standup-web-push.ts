import webpush from "web-push";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type StoredSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

const publicKey =
  process.env.WEBPUSH_VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WEBPUSH_VAPID_PUBLIC_KEY;
const privateKey = process.env.WEBPUSH_VAPID_PRIVATE_KEY;
const subject = process.env.WEBPUSH_VAPID_SUBJECT ?? "mailto:support@flowpilot.app";

let vapidReady = false;
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidReady = true;
  } catch (e) {
    console.error("[webpush] VAPID init failed", e);
  }
}

export function isWebPushConfigured(): boolean {
  return vapidReady;
}

/**
 * Envoie une notification Web Push (navigateur) si l’utilisateur a enregistré une souscription.
 * Supprime la souscription si le endpoint est expiré (410 / 404).
 * `url` : chemin relatif (ex. /standup).
 */
export async function sendUserWebPush(
  userId: string,
  title: string,
  body: string,
  url: string,
): Promise<void> {
  if (!vapidReady) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { webPushSubscription: true },
  });

  const raw = user?.webPushSubscription;
  if (!raw || typeof raw !== "object") return;

  const sub = raw as StoredSubscription;
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
      payload,
      { TTL: 3600 },
    );
  } catch (e: unknown) {
    const status = (e as { statusCode?: number })?.statusCode;
    if (status === 410 || status === 404) {
      await prisma.user.update({
        where: { id: userId },
        data: { webPushSubscription: Prisma.DbNull },
      });
    }
    console.error("[web-push]", userId, e);
  }
}

export async function sendStandupMissedWebPush(userId: string): Promise<void> {
  await sendUserWebPush(
    userId,
    "Standup Pilotys",
    "Tu n’as pas encore fait ton standup ce matin.",
    "/standup",
  );
}
