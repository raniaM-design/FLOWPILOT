import { NextRequest, NextResponse } from "next/server";
import { runWeeklyStaleDecisionsWithoutActionsNotification } from "@/lib/decisions/notify-project-owners-stale-decisions";

/**
 * Cron hebdomadaire (Vercel Cron) : email + notification in-app aux propriétaires de projet
 * si >30 % des décisions sont sans actions depuis 7+ jours.
 *
 * Sécurité : header Authorization: Bearer CRON_SECRET
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
    const summary = await runWeeklyStaleDecisionsWithoutActionsNotification();
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[cron decisions-without-actions-reminder]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
