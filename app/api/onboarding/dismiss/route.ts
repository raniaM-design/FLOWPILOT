import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

/**
 * Marquer l'onboarding comme complété/dismissed
 * POST /api/onboarding/dismiss
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    // Marquer toutes les étapes comme complétées pour masquer l'onboarding
    const allSteps = [
      "create_project",
      "create_meeting",
      "analyze_meeting",
      "create_decisions",
      "create_actions",
      "follow_calendar",
    ];

    await Promise.all(
      allSteps.map((stepKey) =>
        prisma.onboardingStep.upsert({
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
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la fermeture de l'onboarding:", error);
    return NextResponse.json(
      { error: "Erreur lors de la fermeture de l'onboarding" },
      { status: 500 }
    );
  }
}

