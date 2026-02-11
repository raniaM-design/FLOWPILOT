"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { startTranscriptionJob } from "@/lib/meetings/whisper-local";

/**
 * Démarre une transcription audio pour une réunion
 * Retourne le job_id qui sera utilisé pour suivre le statut
 */
export async function startMeetingTranscription(
  meetingId: string,
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string,
  consentRecording: boolean,
  consentProcessing: boolean
): Promise<{ jobId: string; transcriptionJobId: string }> {
  const userId = await getCurrentUserIdOrThrow();

  // Vérifier que la réunion appartient à l'utilisateur
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      ownerId: userId,
    },
  });

  if (!meeting) {
    throw new Error("Réunion non trouvée ou accès non autorisé");
  }

  // Vérifier qu'il n'y a pas déjà un job en cours pour cette réunion
  const existingJob = await prisma.meetingTranscriptionJob.findFirst({
    where: {
      meetingId,
      status: {
        in: ["queued", "processing"],
      },
    },
  });

  if (existingJob) {
    throw new Error("Une transcription est déjà en cours pour cette réunion");
  }

  // Vérifier les consentements obligatoires
  if (!consentRecording || !consentProcessing) {
    throw new Error("Les consentements d'enregistrement et de traitement sont obligatoires");
  }

  // Démarrer le job sur le serveur Whisper
  const whisperJob = await startTranscriptionJob(audioBuffer, fileName, mimeType);

  // Créer le job dans la base de données avec les consentements
  const transcriptionJob = await prisma.meetingTranscriptionJob.create({
    data: {
      meetingId,
      whisperJobId: whisperJob.job_id,
      status: "queued",
      whisperApiUrl: process.env.WHISPER_API_URL || null,
      consentRecording,
      consentProcessing,
      consentDate: new Date(),
    },
  });

  console.log(`[transcription-actions] Job créé: ${transcriptionJob.id} (whisper: ${whisperJob.job_id})`);

  return {
    jobId: whisperJob.job_id,
    transcriptionJobId: transcriptionJob.id,
  };
}

