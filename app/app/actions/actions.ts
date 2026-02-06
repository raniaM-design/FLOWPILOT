"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Créer une action seule (sans réunion, optionnellement liée à une décision)
 */
export async function createStandaloneAction(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();

  const projectId = String(formData.get("projectId") ?? "").trim();
  const decisionId = String(formData.get("decisionId") ?? "").trim() || null;
  const meetingId = String(formData.get("meetingId") ?? "").trim() || null; // Optionnel
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDateStr = String(formData.get("dueDate") ?? "").trim();
  const mentionedUserIdsStr = String(formData.get("mentionedUserIds") ?? "").trim();
  const mentionedUserIds = mentionedUserIdsStr ? mentionedUserIdsStr.split(",").filter(Boolean) : [];
  
  // Fonction helper pour créer les mentions
  const createMentions = async (actionId: string, userIds: string[]) => {
    if (userIds.length === 0) return;
    
    await prisma.actionMention.createMany({
      data: userIds.map((uid) => ({
        actionId,
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

  // Vérifier la décision si fournie
  if (decisionId) {
    const decision = await prisma.decision.findFirst({
      where: {
        id: decisionId,
        project: {
          ownerId: userId,
        },
      },
    });

    if (!decision) {
      throw new Error("Décision non trouvée ou accès non autorisé");
    }
  }

  // Vérifier la réunion si fournie
  if (meetingId) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ownerId: userId,
      },
    });

    if (!meeting) {
      throw new Error("Réunion non trouvée ou accès non autorisé");
    }
  }

  // Parser la date si fournie
  let dueDate: Date | null = null;
  if (dueDateStr) {
    dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      throw new Error("Date invalide");
    }
  }

  // Créer l'action avec status TODO par défaut
  const newAction = await prisma.actionItem.create({
    data: {
      title,
      description,
      status: "TODO",
      projectId,
      decisionId: decisionId || null,
      meetingId: meetingId || null, // Optionnel
      createdById: userId,
      assigneeId: userId, // V1: assigner à l'utilisateur créateur
      dueDate,
    },
  });
  
  // Créer les mentions
  await createMentions(newAction.id, mentionedUserIds);

  // Marquer automatiquement l'étape d'onboarding "create_actions" comme complétée
  try {
    const { checkActionCreation } = await import("@/lib/onboarding/autoCompleteSteps");
    await checkActionCreation(userId);
  } catch (error) {
    // Ne pas bloquer la création de l'action si l'onboarding échoue
    console.error("Erreur lors de la mise à jour de l'onboarding:", error);
  }

  // Revalider les pages concernées
  revalidatePath("/app/actions");
  revalidatePath(`/app/projects/${projectId}`);
  if (decisionId) {
    revalidatePath(`/app/decisions/${decisionId}`);
  }
  revalidatePath("/app");

  // Rediriger vers la liste des actions avec un paramètre de succès
  redirect("/app/actions?created=true");
}

