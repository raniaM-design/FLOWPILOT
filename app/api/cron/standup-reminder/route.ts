import { NextRequest, NextResponse } from "next/server";
import { runStandupMissedReminders } from "@/lib/standup/run-standup-reminders";

/**
 * Cron : rappel email + notification in-app si standup non fait après l’heure configurée.
 * Sécurité : Authorization: Bearer CRON_SECRET
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
    const summary = await runStandupMissedReminders();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[cron standup-reminder]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
