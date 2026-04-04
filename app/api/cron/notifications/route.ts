import { NextRequest, NextResponse } from "next/server";
import { enqueueNotificationTick } from "@/lib/notifications/queue";
import { runScheduledNotifications } from "@/lib/notifications/scheduled-runner";

/**
 * Cron unifié : standup, digests quotidien / hebdomadaire.
 * Si `REDIS_URL` + `NOTIFICATIONS_USE_QUEUE=1`, enfile un job (worker séparé requis).
 * Sinon exécute tout inline (ex. Vercel).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const at = Date.now();
    const queued = await enqueueNotificationTick(at);
    if (queued) {
      return NextResponse.json({ ok: true, queued: true, at });
    }
    const summary = await runScheduledNotifications(new Date(at));
    return NextResponse.json({ ok: true, queued: false, ...summary });
  } catch (e) {
    console.error("[cron notifications]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
