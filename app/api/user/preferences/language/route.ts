import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { language } = await request.json();

    if (!language || (language !== "fr" && language !== "en")) {
      return NextResponse.json({ error: "Langue invalide" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la langue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}

