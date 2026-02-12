import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
];

// Max 25MB pour Whisper, Blob permet les gros fichiers
const MAX_SIZE = 25 * 1024 * 1024;

/**
 * Route pour l'upload client Vercel Blob - contourne la limite 4.5MB des API routes.
 * Génère un token pour que le navigateur uploade directement vers Blob.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await getCurrentUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error: "Blob storage non configuré",
        suggestion: "Ajoutez BLOB_READ_WRITE_TOKEN (Vercel Blob) pour les fichiers > 4 Mo",
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: AUDIO_TYPES,
        maximumSizeInBytes: MAX_SIZE,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ type: "meeting-audio" }),
      }),
      onUploadCompleted: async () => {
        // Callback optionnel - la transcription sera lancée par le client avec l'URL
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
