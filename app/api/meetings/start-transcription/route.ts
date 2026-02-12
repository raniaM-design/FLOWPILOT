import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { startMeetingTranscription } from "@/app/app/meetings/transcription-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Limite Vercel : ~4.5MB pour le body. FormData avec fichier binaire reste plus compact que base64.
const VERCEL_MAX_BODY = 4.3 * 1024 * 1024; // 4.3MB marge de sécurité
const MAX_SIZE = 25 * 1024 * 1024; // 25MB max pour Whisper

/**
 * POST /api/meetings/start-transcription
 * Démarre une transcription audio pour une réunion existante.
 * Accepte :
 * - FormData (fichier binaire) pour fichiers < 4 Mo
 * - JSON { meetingId, audioUrl, fileName, consentRecording, consentProcessing } pour fichiers uploadés via Vercel Blob
 */
export async function POST(request: NextRequest) {
  try {
    await getCurrentUserIdOrThrow();

    const contentType = request.headers.get("content-type") || "";
    let audioBuffer: Buffer;
    let fileName: string;
    let mimeType: string;

    if (contentType.includes("application/json")) {
      // Mode Blob : audioUrl (pour fichiers > 4 Mo)
      const body = await request.json();
      const { meetingId, audioUrl, fileName: fn, consentRecording, consentProcessing } = body;

      if (!meetingId || !audioUrl) {
        return NextResponse.json(
          { error: "meetingId et audioUrl sont requis" },
          { status: 400 }
        );
      }

      if (!consentRecording || !consentProcessing) {
        return NextResponse.json(
          { error: "Les consentements d'enregistrement et de traitement sont obligatoires" },
          { status: 400 }
        );
      }

      // Vérifier que l'URL vient de Vercel Blob
      const blobUrlPattern = /^https:\/\/([a-z0-9-]+\.)?(blob\.vercel-storage\.com|vercel-storage\.com)/;
      if (!blobUrlPattern.test(audioUrl)) {
        return NextResponse.json({ error: "URL audio invalide" }, { status: 400 });
      }

      const res = await fetch(audioUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Impossible de récupérer le fichier audio" },
          { status: 400 }
        );
      }

      const arrayBuffer = await res.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

      if (audioBuffer.length > MAX_SIZE) {
        return NextResponse.json(
          { error: "Le fichier audio est trop volumineux. Taille maximale : 25MB" },
          { status: 400 }
        );
      }

      fileName = fn || "audio.mp3";
      mimeType = "audio/mpeg"; // Par défaut car on ne peut pas deviner depuis l'URL

      console.log(`[api/meetings/start-transcription] Démarrage transcription (Blob) pour réunion ${meetingId}`);

      const result = await startMeetingTranscription(
        meetingId,
        audioBuffer,
        fileName,
        mimeType,
        consentRecording,
        consentProcessing
      );

      // Supprimer le blob après récupération (minimisation des données)
      try {
        await del(audioUrl);
      } catch {
        // Ignorer les erreurs de suppression (blob peut déjà être supprimé)
      }

      return NextResponse.json({
        transcriptionJobId: result.transcriptionJobId,
        whisperJobId: result.jobId,
      });
    }

    // Mode FormData (fichier direct)
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

    if (!consentRecording || !consentProcessing) {
      return NextResponse.json(
        { error: "Les consentements d'enregistrement et de traitement sont obligatoires" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length > VERCEL_MAX_BODY) {
      return NextResponse.json(
        {
          error: "Pour les fichiers > 4 Mo, utilisez l'upload Blob (Vercel Blob requis).",
          suggestion: "Configurez BLOB_READ_WRITE_TOKEN ou compressez l'audio.",
        },
        { status: 413 }
      );
    }

    if (audioBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le fichier audio est trop volumineux. Taille maximale : 25MB" },
        { status: 400 }
      );
    }

    fileName = audioFile.name || "audio.mp3";
    mimeType = audioFile.type || "audio/mpeg";

    console.log(`[api/meetings/start-transcription] Démarrage transcription pour réunion ${meetingId}`);

    const result = await startMeetingTranscription(
      meetingId,
      audioBuffer,
      fileName,
      mimeType,
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

