import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { getTranscriptionJobStatus } from "@/lib/meetings/whisper-local";
import { generateProfessionalMeetingMinutes } from "@/lib/meetings/professional-minutes-generator";
import { canAccessMeeting } from "@/lib/meetings/check-meeting-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/transcriptions/poll?transcriptionJobId=xxx
 * Interroge le statut d'une transcription et met à jour la base de données
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const searchParams = request.nextUrl.searchParams;
    const transcriptionJobId = searchParams.get("transcriptionJobId");

    if (!transcriptionJobId) {
      return NextResponse.json(
        { error: "transcriptionJobId requis" },
        { status: 400 }
      );
    }

    // Récupérer le job depuis la base de données
    const transcriptionJob = await prisma.meetingTranscriptionJob.findFirst({
      where: {
        id: transcriptionJobId,
        deletedAt: null, // Exclure les jobs supprimés
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!transcriptionJob) {
      return NextResponse.json(
        { error: "Job de transcription non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions : propriétaire, mentionné, ou membre du projet/entreprise
    const hasAccess = await canAccessMeeting(userId, transcriptionJob.meetingId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette transcription" },
        { status: 403 }
      );
    }

    // Si le job est déjà terminé, retourner le statut actuel
    if (transcriptionJob.status === "done" || transcriptionJob.status === "error") {
      return NextResponse.json({
        status: transcriptionJob.status,
        transcribedText: transcriptionJob.transcribedText,
        segments: transcriptionJob.segments ? JSON.parse(transcriptionJob.segments) : null,
        errorMessage: transcriptionJob.errorMessage,
        completedAt: transcriptionJob.completedAt,
      });
    }

    // Interroger le serveur Whisper pour le statut actuel
    const whisperStatus = await getTranscriptionJobStatus(transcriptionJob.whisperJobId);

    // Mettre à jour le job dans la base de données
    const updateData: {
      status: string;
      transcribedText?: string | null;
      segments?: string | null;
      errorMessage?: string | null;
      completedAt?: Date | null;
    } = {
      status: whisperStatus.status,
    };

    if (whisperStatus.status === "done") {
      updateData.transcribedText = whisperStatus.text || null;
      updateData.segments = whisperStatus.segments ? JSON.stringify(whisperStatus.segments) : null;
      updateData.completedAt = new Date();

      // Si le texte est disponible, générer le compte rendu professionnel et mettre à jour la réunion
      if (whisperStatus.text) {
        try {
          // Vérifier si l'anonymisation était demandée (via consentProcessing ou option)
          // Pour l'instant, on n'anonymise pas automatiquement, mais on pourrait ajouter un champ dans le job
          const professionalMinutesHtml = await generateProfessionalMeetingMinutes(whisperStatus.text, {
            anonymize: false, // Par défaut, ne pas anonymiser. L'utilisateur peut le faire via l'UI
          });
          
          // Mettre à jour la réunion avec le texte transcrit et le compte rendu professionnel
          await prisma.meeting.update({
            where: {
              id: transcriptionJob.meetingId,
            },
            data: {
              raw_notes: professionalMinutesHtml, // Utiliser le compte rendu professionnel comme notes
            },
          });

          // Marquer l'audio comme supprimé (il est supprimé automatiquement par le serveur Whisper)
          await prisma.meetingTranscriptionJob.update({
            where: {
              id: transcriptionJobId,
            },
            data: {
              audioDeletedAt: new Date(),
            },
          });

          console.log(`[api/transcriptions/poll] ✅ Réunion ${transcriptionJob.meetingId} mise à jour avec la transcription (audio supprimé)`);
        } catch (error) {
          console.error("[api/transcriptions/poll] Erreur génération compte rendu professionnel:", error);
          // Ne pas bloquer la réponse si la génération échoue
        }
      }
    } else if (whisperStatus.status === "error") {
      updateData.errorMessage = whisperStatus.error || "Erreur inconnue";
      updateData.completedAt = new Date();
    }

    await prisma.meetingTranscriptionJob.update({
      where: {
        id: transcriptionJobId,
      },
      data: updateData,
    });

    return NextResponse.json({
      status: whisperStatus.status,
      transcribedText: whisperStatus.text,
      segments: whisperStatus.segments,
      errorMessage: whisperStatus.error,
      completedAt: updateData.completedAt,
    });
  } catch (error: any) {
    console.error("[api/transcriptions/poll] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}

