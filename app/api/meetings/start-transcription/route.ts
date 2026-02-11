import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { startMeetingTranscription } from "@/app/app/meetings/transcription-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/meetings/start-transcription
 * Démarre une transcription audio pour une réunion existante
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const body = await request.json();

    const { meetingId, fileName, fileSize, mimeType, audioBase64, consentRecording, consentProcessing } = body;

    if (!meetingId || !fileName || !audioBase64) {
      return NextResponse.json(
        { error: "meetingId, fileName et audioBase64 sont requis" },
        { status: 400 }
      );
    }

    // Vérifier les consentements obligatoires
    if (!consentRecording || !consentProcessing) {
      return NextResponse.json(
        { error: "Les consentements d'enregistrement et de traitement sont obligatoires" },
        { status: 400 }
      );
    }

    // Convertir base64 en Buffer
    const audioBuffer = Buffer.from(audioBase64, "base64");

    // Vérifier la taille
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        { error: "Le fichier audio est trop volumineux. Taille maximale : 25MB" },
        { status: 400 }
      );
    }

    console.log(`[api/meetings/start-transcription] Démarrage transcription pour réunion ${meetingId}`);

    // Démarrer la transcription
    const result = await startMeetingTranscription(
      meetingId,
      audioBuffer,
      fileName,
      mimeType || "audio/mpeg",
      consentRecording,
      consentProcessing
    );

    return NextResponse.json({
      transcriptionJobId: result.transcriptionJobId,
      whisperJobId: result.jobId,
    });
  } catch (error: any) {
    console.error("[api/meetings/start-transcription] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du démarrage de la transcription" },
      { status: 500 }
    );
  }
}

