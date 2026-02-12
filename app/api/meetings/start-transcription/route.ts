import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { startMeetingTranscription } from "@/app/app/meetings/transcription-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Limite Vercel : ~4.5MB pour le body. FormData avec fichier binaire reste plus compact que base64.
const VERCEL_MAX_BODY = 4.3 * 1024 * 1024; // 4.3MB marge de sécurité

/**
 * POST /api/meetings/start-transcription
 * Démarre une transcription audio pour une réunion existante
 * Accepte FormData (fichier binaire) pour éviter le surcoût base64 et rester sous la limite Vercel
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const formData = await request.formData();

    const meetingId = formData.get("meetingId") as string | null;
    const consentRecording = formData.get("consentRecording") === "true";
    const consentProcessing = formData.get("consentProcessing") === "true";
    const audioFile = formData.get("audio") as File | null;

    if (!meetingId || !audioFile) {
      return NextResponse.json(
        { error: "meetingId et fichier audio sont requis" },
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

    // Lire le fichier en Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Vérifier la taille (limite Vercel)
    if (audioBuffer.length > VERCEL_MAX_BODY) {
      return NextResponse.json(
        {
          error: "Le fichier audio est trop volumineux pour l'upload direct (max ~4 Mo).",
          suggestion: "Compressez l'audio ou utilisez un enregistrement plus court.",
        },
        { status: 413 }
      );
    }

    const maxSize = 25 * 1024 * 1024; // 25MB max pour Whisper
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        { error: "Le fichier audio est trop volumineux. Taille maximale : 25MB" },
        { status: 400 }
      );
    }

    const fileName = audioFile.name || "audio.mp3";
    const mimeType = audioFile.type || "audio/mpeg";

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

