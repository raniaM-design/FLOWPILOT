/**
 * Client Whisper local pour la transcription audio
 * Utilise un modèle Whisper hébergé sur votre propre infrastructure
 * 
 * Pour utiliser cette solution :
 * 1. Déployez Whisper sur votre serveur (voir DEPLOY_WHISPER_SERVER.md)
 * 2. Configurez WHISPER_API_URL dans vos variables d'environnement
 */

export interface WhisperTranscriptionResult {
  text: string;
  language?: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export interface WhisperJobStatus {
  job_id: string;
  status: "queued" | "processing" | "done" | "error";
  text?: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
  error?: string;
}

/**
 * Démarre une transcription asynchrone et retourne un job_id
 */
export async function startTranscriptionJob(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ job_id: string; status: string }> {
  const whisperApiUrl = process.env.WHISPER_API_URL;
  
  if (!whisperApiUrl) {
    throw new Error("WHISPER_API_URL non configuré. Configurez l'URL de votre serveur Whisper local.");
  }

  // Créer un FormData pour envoyer le fichier audio
  const formData = new FormData();
  // Convertir Buffer en Uint8Array pour compatibilité avec Blob
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  formData.append("file", blob, fileName);

  console.log("[whisper-local] Envoi de l'audio à votre serveur Whisper (mode async):", {
    url: whisperApiUrl,
    fileName,
    size: `${Math.round(audioBuffer.length / 1024 / 1024 * 100) / 100}MB`,
  });

  const headers: HeadersInit = {};
  if (process.env.WHISPER_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.WHISPER_API_KEY}`;
  }

  const response = await fetch(`${whisperApiUrl}/transcribe`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[whisper-local] Erreur serveur Whisper:", errorText);
    throw new Error(`Erreur création job transcription: ${errorText}`);
  }

  const result = await response.json();
  
  console.log("[whisper-local] ✅ Job créé:", result.job_id);

  return {
    job_id: result.job_id,
    status: result.status,
  };
}

/**
 * Récupère le statut d'un job de transcription
 */
export async function getTranscriptionJobStatus(jobId: string): Promise<WhisperJobStatus> {
  const whisperApiUrl = process.env.WHISPER_API_URL;
  
  if (!whisperApiUrl) {
    throw new Error("WHISPER_API_URL non configuré.");
  }

  const headers: HeadersInit = {};
  if (process.env.WHISPER_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.WHISPER_API_KEY}`;
  }

  const response = await fetch(`${whisperApiUrl}/transcribe/${jobId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Job introuvable");
    }
    const errorText = await response.text();
    console.error("[whisper-local] Erreur récupération statut:", errorText);
    throw new Error(`Erreur récupération statut: ${errorText}`);
  }

  return await response.json();
}

/**
 * Transcrit un fichier audio via votre API Whisper locale (mode synchrone - legacy)
 * @deprecated Utilisez startTranscriptionJob et getTranscriptionJobStatus pour le mode async
 */
export async function transcribeWithLocalWhisper(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<WhisperTranscriptionResult> {
  const whisperApiUrl = process.env.WHISPER_API_URL;
  
  if (!whisperApiUrl) {
    throw new Error("WHISPER_API_URL non configuré. Configurez l'URL de votre serveur Whisper local.");
  }

  // Créer un FormData pour envoyer le fichier audio
  const formData = new FormData();
  // Convertir Buffer en Uint8Array pour compatibilité avec Blob
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("model", process.env.WHISPER_MODEL || "base"); // base, small, medium, large
  formData.append("language", process.env.WHISPER_LANGUAGE || "fr"); // Optionnel, peut être détecté automatiquement
  formData.append("response_format", "json");

  console.log("[whisper-local] Envoi de l'audio à votre serveur Whisper:", {
    url: whisperApiUrl,
    fileName,
    size: `${Math.round(audioBuffer.length / 1024 / 1024 * 100) / 100}MB`,
  });

  const headers: HeadersInit = {};
  if (process.env.WHISPER_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.WHISPER_API_KEY}`;
  }

  const response = await fetch(`${whisperApiUrl}/transcribe`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[whisper-local] Erreur serveur Whisper:", errorText);
    throw new Error(`Erreur transcription Whisper locale: ${errorText}`);
  }

  const result = await response.json();
  
  console.log("[whisper-local] ✅ Transcription réussie via votre serveur Whisper");

  return {
    text: result.text || "",
    language: result.language,
    segments: result.segments,
  };
}

/**
 * Vérifie si le serveur Whisper local est disponible
 */
export async function checkLocalWhisperHealth(): Promise<boolean> {
  const whisperApiUrl = process.env.WHISPER_API_URL;
  
  if (!whisperApiUrl) {
    return false;
  }

  try {
    const response = await fetch(`${whisperApiUrl}/health`, {
      method: "GET",
      headers: process.env.WHISPER_API_KEY
        ? {
            "Authorization": `Bearer ${process.env.WHISPER_API_KEY}`,
          }
        : undefined,
    });

    return response.ok;
  } catch (error) {
    console.error("[whisper-local] Erreur vérification santé:", error);
    return false;
  }
}

