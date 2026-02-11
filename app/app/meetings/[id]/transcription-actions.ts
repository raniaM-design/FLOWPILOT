"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { revalidatePath } from "next/cache";
import { canAccessMeeting } from "@/lib/meetings/check-meeting-access";

/**
 * Supprime une transcription (soft delete)
 */
export async function deleteTranscription(transcriptionJobId: string) {
  const userId = await getCurrentUserIdOrThrow();

  // Vérifier que la transcription existe et n'est pas déjà supprimée
  const transcriptionJob = await prisma.meetingTranscriptionJob.findFirst({
    where: {
      id: transcriptionJobId,
      deletedAt: null, // Ne pas supprimer deux fois
    },
    include: {
      meeting: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!transcriptionJob) {
    throw new Error("Transcription non trouvée");
  }

  // Vérifier les permissions : propriétaire, mentionné, ou membre du projet/entreprise
  const hasAccess = await canAccessMeeting(userId, transcriptionJob.meetingId);
  if (!hasAccess) {
    throw new Error("Accès non autorisé à cette transcription");
  }

  // Soft delete
  await prisma.meetingTranscriptionJob.update({
    where: {
      id: transcriptionJobId,
    },
    data: {
      deletedAt: new Date(),
      // Supprimer aussi le texte transcrit pour protection des données
      transcribedText: null,
      segments: null,
    },
  });

  revalidatePath(`/app/meetings/${transcriptionJob.meeting.id}`);
}

/**
 * Supprime définitivement une transcription (hard delete)
 * À utiliser uniquement pour le nettoyage automatique (cron)
 */
export async function hardDeleteTranscription(transcriptionJobId: string) {
  await prisma.meetingTranscriptionJob.delete({
    where: {
      id: transcriptionJobId,
    },
  });
}

