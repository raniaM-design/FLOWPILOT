"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getNextStepForProject } from "@/lib/next-step";

export async function createProject(formData: FormData) {
  const userId = await getCurrentUserIdOrThrow();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();
  const teamMembersStr = String(formData.get("teamMembers") ?? "").trim();

  // Validation
  if (!name || name.length < 2) {
    throw new Error("Le nom du projet doit contenir au moins 2 caractères");
  }

  // Parser teamMembers si fourni
  let teamMembers: string | null = null;
  if (teamMembersStr) {
    try {
      const parsed = JSON.parse(teamMembersStr);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        teamMembers = parsed.length > 0 ? JSON.stringify(parsed) : null;
      }
    } catch (error) {
      // Si le parsing échoue, ignorer (peut être vide ou mal formé)
      console.warn("Erreur lors du parsing de teamMembers:", error);
    }
  }

  // Créer le projet avec status ACTIVE par défaut
  await prisma.project.create({
    data: {
      name,
      description: description || null,
      client: client || null,
      teamMembers: teamMembers || null,
      status: "ACTIVE",
      ownerId: userId,
    },
  });

  redirect("/app/projects");
}

/**
 * Mettre à jour le statut d'un projet
 */
export async function updateProjectStatus(
  projectId: string,
  newStatus: "ACTIVE" | "PAUSED" | "DONE"
) {
  const userId = await getCurrentUserIdOrThrow();

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

  const wasDone = project.status === "DONE";
  const isNowDone = newStatus === "DONE";

  // Mettre à jour le statut uniquement si le projet appartient à l'utilisateur
  const updated = await prisma.project.updateMany({
    where: {
      id: projectId,
      ownerId: userId,
    },
    data: {
      status: newStatus,
    },
  });

  if (updated.count === 0) {
    throw new Error("Projet non trouvé ou accès non autorisé");
  }

  // Revalider les pages concernées
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");
  revalidatePath("/app");

  // Si le projet vient de passer en DONE, calculer la prochaine étape
  let nextStep: string | undefined;
  if (!wasDone && isNowDone) {
    try {
      nextStep = await getNextStepForProject(projectId, userId);
    } catch (error) {
      // Ignorer les erreurs de calcul de nextStep
      console.error("Erreur calcul nextStep:", error);
    }
  }

  return { ok: true, justCompleted: !wasDone && isNowDone, nextStep };
}
