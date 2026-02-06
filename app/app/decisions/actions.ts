"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Créer une nouvelle décision depuis /app/decisions/new
 */
export async function createDecision(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();

  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const mentionedUserIdsStr = String(formData.get("mentionedUserIds") ?? "").trim();
  const mentionedUserIds = mentionedUserIdsStr ? mentionedUserIdsStr.split(",").filter(Boolean) : [];
  
  // Fonction helper pour créer les mentions
  const createMentions = async (decisionId: string, userIds: string[]) => {
    if (userIds.length === 0) return;
    
    await prisma.decisionMention.createMany({
      data: userIds.map((uid) => ({
        decisionId,
        userId: uid,
      })),
      skipDuplicates: true,
    });
  };

  // Validation
  if (!projectId) {
    throw new Error("Veuillez sélectionner un projet");
  }

  if (!title || title.length < 2) {
    throw new Error("Le titre doit contenir au moins 2 caractères");
  }

  // Vérifier que le projet appartient à l'utilisateur
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (!project) {
    throw new Error("Projet non trouvé ou accès non autorisé");
  }

  // Créer la décision avec status DRAFT par défaut
  const newDecision = await prisma.decision.create({
    data: {
      title,
      context: context || null,
      decision: decision || null,
      status: "DRAFT",
      projectId,
      createdById: userId,
    },
  });
  
  // Créer les mentions
  await createMentions(newDecision.id, mentionedUserIds);

  // Marquer automatiquement l'étape d'onboarding "create_decisions" comme complétée
  try {
    const { checkDecisionCreation } = await import("@/lib/onboarding/autoCompleteSteps");
    await checkDecisionCreation(userId);
  } catch (error) {
    // Ne pas bloquer la création de la décision si l'onboarding échoue
    console.error("Erreur lors de la mise à jour de l'onboarding:", error);
  }

  // Revalider les pages concernées
  revalidatePath("/app/decisions");
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app");

  // Rediriger vers la page de la décision créée
  redirect(`/app/decisions/${newDecision.id}`);
}

