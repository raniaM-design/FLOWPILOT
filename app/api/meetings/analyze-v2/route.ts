import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { analyzeMeeting } from "@/lib/meetings/meeting-analyzer";

/**
 * API Route pour analyser un compte-rendu (nouvelle version)
 * POST /api/meetings/analyze-v2
 * Body: { rawText: string, locale?: "fr-FR" }
 */
export async function POST(request: NextRequest) {
  try {
    await getCurrentUserIdOrThrow(); // Vérifier auth

    const body = await request.json();
    const { rawText, locale } = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "rawText est requis et doit être une string" },
        { status: 400 }
      );
    }

    const result = await analyzeMeeting(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'analyse: ${errorMessage}` },
      { status: 500 }
    );
  }
}

