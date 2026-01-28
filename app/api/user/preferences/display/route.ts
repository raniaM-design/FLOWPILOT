import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayReduceAnimations: true,
        displayMode: true,
        displayDensity: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      reduceAnimations: user.displayReduceAnimations ?? false,
      displayMode: user.displayMode ?? "standard",
      density: user.displayDensity ?? "standard",
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { reduceAnimations, displayMode, density } = body;

    // Validation
    if (typeof reduceAnimations !== "boolean") {
      return NextResponse.json(
        { error: "reduceAnimations doit être un booléen" },
        { status: 400 }
      );
    }

    if (displayMode && !["standard", "simplified"].includes(displayMode)) {
      return NextResponse.json(
        { error: "displayMode invalide" },
        { status: 400 }
      );
    }

    if (density && !["comfort", "standard", "compact"].includes(density)) {
      return NextResponse.json(
        { error: "density invalide" },
        { status: 400 }
      );
    }

    // Mise à jour des préférences
    await prisma.user.update({
      where: { id: userId },
      data: {
        displayReduceAnimations: reduceAnimations,
        displayMode: displayMode || null,
        displayDensity: density || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}

