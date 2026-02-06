import { prisma } from "@/lib/db";

/**
 * Marque automatiquement les étapes d'onboarding comme complétées selon les actions de l'utilisateur
 */

/**
 * Marque l'étape "create_project" comme complétée si l'utilisateur a créé au moins un projet
 */
export async function checkProjectCreation(userId: string): Promise<void> {
  try {
    // Vérifier si le modèle existe dans le client Prisma
    if (!(prisma as any).onboardingStep) {
      return;
    }

    const projectCount = await prisma.project.count({
      where: { ownerId: userId },
    });

    if (projectCount > 0) {
      await (prisma as any).onboardingStep.upsert({
        where: {
          userId_stepKey: {
            userId,
            stepKey: "create_project",
          },
        },
        create: {
          userId,
          stepKey: "create_project",
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      });
      
      // Revalider la page d'accueil pour mettre à jour l'onboarding
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/app");
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de création de projet:", error);
  }
}

/**
 * Marque l'étape "create_meeting" comme complétée si l'utilisateur a créé au moins une réunion
 */
export async function checkMeetingCreation(userId: string): Promise<void> {
  try {
    // Vérifier si le modèle existe dans le client Prisma
    if (!(prisma as any).onboardingStep) {
      return;
    }

    const meetingCount = await prisma.meeting.count({
      where: { ownerId: userId },
    });

    if (meetingCount > 0) {
      await (prisma as any).onboardingStep.upsert({
        where: {
          userId_stepKey: {
            userId,
            stepKey: "create_meeting",
          },
        },
        create: {
          userId,
          stepKey: "create_meeting",
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de création de réunion:", error);
  }
}

/**
 * Marque l'étape "analyze_meeting" comme complétée si l'utilisateur a analysé au moins une réunion
 */
export async function checkMeetingAnalysis(userId: string): Promise<void> {
  try {
    // Vérifier si le modèle existe dans le client Prisma
    if (!(prisma as any).onboardingStep) {
      return;
    }

    const analyzedMeeting = await prisma.meeting.findFirst({
      where: {
        ownerId: userId,
        analyzedAt: { not: null },
      },
    });

    if (analyzedMeeting) {
      await (prisma as any).onboardingStep.upsert({
        where: {
          userId_stepKey: {
            userId,
            stepKey: "analyze_meeting",
          },
        },
        create: {
          userId,
          stepKey: "analyze_meeting",
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification d'analyse de réunion:", error);
  }
}

/**
 * Marque l'étape "create_decisions" comme complétée si l'utilisateur a créé au moins une décision
 */
export async function checkDecisionCreation(userId: string): Promise<void> {
  try {
    // Vérifier si le modèle existe dans le client Prisma
    if (!(prisma as any).onboardingStep) {
      return;
    }

    const decisionCount = await prisma.decision.count({
      where: { createdById: userId },
    });

    if (decisionCount > 0) {
      await (prisma as any).onboardingStep.upsert({
        where: {
          userId_stepKey: {
            userId,
            stepKey: "create_decisions",
          },
        },
        create: {
          userId,
          stepKey: "create_decisions",
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de création de décision:", error);
  }
}

/**
 * Marque l'étape "create_actions" comme complétée si l'utilisateur a créé au moins une action
 */
export async function checkActionCreation(userId: string): Promise<void> {
  try {
    // Vérifier si le modèle existe dans le client Prisma
    if (!(prisma as any).onboardingStep) {
      return;
    }

    const actionCount = await prisma.actionItem.count({
      where: { createdById: userId },
    });

    if (actionCount > 0) {
      await (prisma as any).onboardingStep.upsert({
        where: {
          userId_stepKey: {
            userId,
            stepKey: "create_actions",
          },
        },
        create: {
          userId,
          stepKey: "create_actions",
          completed: true,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de création d'action:", error);
  }
}

/**
 * Vérifie et met à jour toutes les étapes d'onboarding automatiquement
 */
export async function checkAllOnboardingSteps(userId: string): Promise<void> {
  await Promise.all([
    checkProjectCreation(userId),
    checkMeetingCreation(userId),
    checkMeetingAnalysis(userId),
    checkDecisionCreation(userId),
    checkActionCreation(userId),
  ]);
}

