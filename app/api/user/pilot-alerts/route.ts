import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { getPilotAlertCounts } from "@/lib/chatbot/pilot-alert-counts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/pilot-alerts — compteurs temps réel pour le badge Pilot (client).
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const counts = await getPilotAlertCounts(session.userId);
    return NextResponse.json(counts);
  } catch (e) {
    console.error("[pilot-alerts]", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
