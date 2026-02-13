"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateMeetingResult = { error?: string } | null;

export async function createMeeting(
  prevState: CreateMeetingResult | null,
  formData: FormData
): Promise<CreateMeetingResult> {
  const userId = await getCurrentUserIdOrThrow();

  const title = formData.get("title") as string;
  const dateStr = formData.get("date") as string;
  const participants = formData.get("participants") as string | null;
  const context = formData.get("context") as string | null;
  const raw_notes = formData.get("raw_notes") as string;
  // Normaliser projectId : chaîne vide ou null devient null
  const projectIdRaw = formData.get("projectId") as string | null;
  const projectId = projectIdRaw && projectIdRaw.trim() !== "" ? projectIdRaw.trim() : null;
  const mentionedUserIdsStr = String(formData.get("mentionedUserIds") ?? "").trim();
  const mentionedUserIds = mentionedUserIdsStr ? mentionedUserIdsStr.split(",").filter(Boolean) : [];
  
  // Fonction helper pour créer les mentions
  const createMentions = async (meetingId: string, userIds: string[]) => {
    if (userIds.length === 0) return;
    
    await prisma.meetingMention.createMany({
      data: userIds.map((uid) => ({
        meetingId,
        userId: uid,
      })),
      skipDuplicates: true,
    });
  };

  if (!title || !dateStr || !raw_notes) {
    return { error: "Titre, date et notes sont requis" };
  }

  if (!projectId) {
    return { error: "Veuillez sélectionner un projet" };
  }

  // Vérifier que le projet appartient à l'utilisateur
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });

  if (!project) {
    return { error: "Projet non trouvé ou accès non autorisé" };
  }

  const date = new Date(dateStr);

  const newMeeting = await prisma.meeting.create({
    data: {
      ownerId: userId,
      projectId: projectId || null,
      title,
      date,
      participants: participants || null,
      context: context || null,
      raw_notes,
    },
  });
  
  // Créer les mentions
  await createMentions(newMeeting.id, mentionedUserIds);

  // Marquer automatiquement l'étape d'onboarding "create_meeting" comme complétée
  try {
    const { checkMeetingCreation } = await import("@/lib/onboarding/autoCompleteSteps");
    await checkMeetingCreation(userId);
  } catch (error) {
    // Ne pas bloquer la création de la réunion si l'onboarding échoue
    console.error("Erreur lors de la mise à jour de l'onboarding:", error);
  }

  // Revalider les pages concernées
  revalidatePath("/app/meetings");
  revalidatePath(`/app/meetings/${newMeeting.id}/analyze`);
  // Revalider aussi la page projet si un projet est associé
  if (projectId) {
    revalidatePath(`/app/projects/${projectId}`);
  }
  
  // Rediriger directement vers la page d'analyse pour permettre l'analyse immédiate
  redirect(`/app/meetings/${newMeeting.id}/analyze`);
}

