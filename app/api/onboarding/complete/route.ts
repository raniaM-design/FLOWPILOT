import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

/**
 * Marquer une étape d'onboarding comme complétée
 * POST /api/onboarding/complete
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const body = await request.json();
    const { stepKey } = body;

    if (!stepKey || typeof stepKey !== "string") {
      return NextResponse.json(
        { error: "stepKey est requis" },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour l'étape d'onboarding
    await prisma.onboardingStep.upsert({
      where: {
        userId_stepKey: {
          userId,
          stepKey,
        },
      },
      create: {
        userId,
        stepKey,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la complétion de l'étape:", error);
    return NextResponse.json(
      { error: "Erreur lors de la complétion de l'étape" },
      { status: 500 }
    );
  }
}

