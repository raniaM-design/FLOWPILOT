import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { getChatbotUserContext } from "@/lib/chatbot/user-context";
import { resolvePilotMessage } from "@/lib/chatbot/resolve-pilot-message";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chatbot
 * Réponses Pilot structurées (3 phrases, prénom, liens /app/…, ton selon retards).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];

    const ctx = await getChatbotUserContext(session.userId);
    const response = resolvePilotMessage(message.trim(), history, ctx);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[chatbot] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du message" },
      { status: 500 },
    );
  }
}
