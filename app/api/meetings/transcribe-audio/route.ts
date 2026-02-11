import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/meetings/transcribe-audio
 * Transcrit un fichier audio en texte et génère un compte rendu professionnel
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Aucun fichier audio fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg", "audio/m4a", "audio/x-m4a"];
    if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|webm|ogg|m4a|mp4)$/i)) {
      return NextResponse.json(
        { error: "Format audio non supporté. Formats acceptés : MP3, WAV, WebM, OGG, M4A" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 25MB pour OpenAI Whisper, mais Vercel limite à ~4.5MB pour les fonctions serverless)
    // Pour les fichiers plus gros, utiliser le système async avec /api/meetings/start-transcription
    const maxSize = 25 * 1024 * 1024; // 25MB
    const vercelMaxSize = 4.5 * 1024 * 1024; // ~4.5MB limite Vercel
    
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { 
          error: "Le fichier audio est trop volumineux. Taille maximale : 25MB",
          suggestion: "Pour les fichiers volumineux, utilisez le système de transcription asynchrone"
        },
        { status: 413 }
      );
    }
    
    if (audioFile.size > vercelMaxSize) {
      return NextResponse.json(
        { 
          error: "Le fichier audio est trop volumineux pour cette méthode. Taille maximale : 4.5MB",
          suggestion: "Pour les fichiers plus volumineux, utilisez le système de transcription asynchrone via l'interface de réunion"
        },
        { status: 413 }
      );
    }

    console.log("[meetings/transcribe-audio] Début de la transcription:", {
      fileName: audioFile.name,
      fileSize: `${Math.round(audioFile.size / 1024 / 1024 * 100) / 100}MB`,
      fileType: audioFile.type,
    });

    // Convertir le fichier en buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Priorité : Whisper local (votre propre serveur) > Hugging Face (gratuit) > OpenAI (payant)
    let rawTranscript = "";
    let transcriptionMethod = "";

    // Option 1 : Whisper Local (Votre propre serveur - SÉCURISÉ)
    if (process.env.WHISPER_API_URL) {
      try {
        console.log("[meetings/transcribe-audio] Utilisation de votre serveur Whisper local (sécurisé)...");
        transcriptionMethod = "local";
        
        const { transcribeWithLocalWhisper } = await import("@/lib/meetings/whisper-local");
        const result = await transcribeWithLocalWhisper(
          buffer,
          audioFile.name,
          audioFile.type || "audio/mpeg"
        );
        
        rawTranscript = result.text || "";
        
        if (rawTranscript) {
          console.log("[meetings/transcribe-audio] ✅ Transcription réussie via votre serveur Whisper (sécurisé)");
        } else {
          throw new Error("Transcription vide depuis le serveur local");
        }
      } catch (localError: any) {
        console.log("[meetings/transcribe-audio] Erreur Whisper local, fallback sur services externes:", localError.message);
        // Continuer avec les autres options
        rawTranscript = "";
      }
    }

    // Option 2 : Hugging Face Inference API (GRATUIT avec quota)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        console.log("[meetings/transcribe-audio] Utilisation de Hugging Face Whisper (gratuit)...");
        transcriptionMethod = "huggingface";
        
        // Hugging Face accepte les fichiers audio directement
        const hfFormData = new FormData();
        const blob = new Blob([buffer], { type: audioFile.type || "audio/mpeg" });
        hfFormData.append("file", blob, audioFile.name);
        
        // Utiliser le modèle Whisper de Hugging Face
        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            },
            body: hfFormData,
          }
        );

        if (hfResponse.ok) {
          const hfData = await hfResponse.json();
          
          // Hugging Face retourne soit directement le texte, soit un objet avec text
          if (typeof hfData === "string") {
            rawTranscript = hfData;
          } else if (hfData.text) {
            rawTranscript = hfData.text;
          } else if (hfData[0]?.text) {
            rawTranscript = hfData[0].text;
          }
          
          if (rawTranscript) {
            console.log("[meetings/transcribe-audio] ✅ Transcription réussie via Hugging Face (gratuit)");
          } else {
            throw new Error("Réponse Hugging Face invalide");
          }
        } else {
          const errorText = await hfResponse.text();
          console.log("[meetings/transcribe-audio] Hugging Face non disponible:", errorText);
          // Si Hugging Face échoue, essayer OpenAI
          throw new Error(`Hugging Face error: ${errorText}`);
        }
      } catch (hfError: any) {
        console.log("[meetings/transcribe-audio] Erreur Hugging Face, fallback sur OpenAI:", hfError.message);
        // Continuer avec OpenAI si disponible
        rawTranscript = ""; // Réinitialiser pour forcer l'essai OpenAI
      }
    }

    // Option 3 : OpenAI Whisper (si les options précédentes ne sont pas disponibles)
    if (!rawTranscript && process.env.OPENAI_API_KEY) {
      try {
        console.log("[meetings/transcribe-audio] Utilisation d'OpenAI Whisper...");
        transcriptionMethod = "openai";
        
        // Créer un FormData pour OpenAI Whisper
        const openAIFormData = new FormData();
        const blob = new Blob([buffer], { type: audioFile.type || "audio/mpeg" });
        openAIFormData.append("file", blob, audioFile.name);
        openAIFormData.append("model", "whisper-1");
        openAIFormData.append("language", "fr");

        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: openAIFormData,
        });

        if (!whisperResponse.ok) {
          const errorText = await whisperResponse.text();
          console.error("[meetings/transcribe-audio] Erreur OpenAI Whisper:", errorText);
          throw new Error(`Erreur OpenAI: ${errorText}`);
        }

        const whisperData = await whisperResponse.json();
        rawTranscript = whisperData.text || "";
        
        if (rawTranscript) {
          console.log("[meetings/transcribe-audio] ✅ Transcription réussie via OpenAI");
        }
      } catch (openAIError) {
        console.error("[meetings/transcribe-audio] Erreur OpenAI:", openAIError);
        // Si toutes les options échouent, retourner une erreur
        if (!process.env.WHISPER_API_URL && !process.env.HUGGINGFACE_API_KEY && !process.env.OPENAI_API_KEY) {
          return NextResponse.json(
            { 
              error: "Aucune configuration de transcription disponible.\n\nOptions disponibles :\n\n1. WHISPER_API_URL (recommandé - sécurisé)\n   Déployez votre propre serveur Whisper (voir DEPLOY_WHISPER_SERVER.md)\n   Vos données restent sur votre infrastructure\n\n2. HUGGINGFACE_API_KEY (gratuit - 1000 requêtes/mois)\n   Créez un compte sur huggingface.co\n   Données envoyées à Hugging Face\n\n3. OPENAI_API_KEY (payant - ~$0.006/min)\n   Créez un compte sur platform.openai.com\n   Données envoyées à OpenAI\n\nRecommandation : Déployez votre propre serveur Whisper pour la sécurité maximale !",
              requiresAPIKey: true 
            },
            { status: 400 }
          );
        }
        throw openAIError;
      }
    }

    // Si aucune transcription n'a réussi
    if (!rawTranscript) {
      return NextResponse.json(
        { 
          error: "Aucune transcription n'a pu être générée. Vérifiez vos clés API ou la qualité de l'audio.",
          requiresAPIKey: !process.env.HUGGINGFACE_API_KEY && !process.env.OPENAI_API_KEY
        },
        { status: 400 }
      );
    }

    if (!rawTranscript || rawTranscript.trim().length === 0) {
      return NextResponse.json(
        { error: "Aucun texte n'a été transcrit depuis l'audio. Vérifiez que l'audio contient bien de la parole." },
        { status: 400 }
      );
    }

    console.log("[meetings/transcribe-audio] Transcription brute obtenue:", {
      length: rawTranscript.length,
      preview: rawTranscript.substring(0, 100) + "...",
    });

    // Améliorer et structurer le texte transcrit avec GPT
    console.log("[meetings/transcribe-audio] Amélioration du texte transcrit...");
    const improvedText = await improveTranscript(rawTranscript);

    console.log("[meetings/transcribe-audio] ✅ Transcription et amélioration terminées");
    console.log("[meetings/transcribe-audio] Méthode utilisée:", transcriptionMethod || "inconnue");

    return NextResponse.json({
      success: true,
      rawTranscript,
      improvedText,
      transcriptionMethod: transcriptionMethod || "unknown",
      message: "Audio transcrit et compte rendu généré avec succès",
    });
  } catch (error: any) {
    console.error("[meetings/transcribe-audio] Erreur:", error);
    return NextResponse.json(
      { error: `Erreur lors de la transcription : ${error.message || "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}

/**
 * Améliore le texte transcrit pour générer un compte rendu professionnel
 */
async function improveTranscript(rawTranscript: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    // Si pas d'OpenAI, retourner le texte brut avec un formatage basique
    return formatBasicTranscript(rawTranscript);
  }

  const prompt = `Tu es un expert en rédaction de comptes rendus de réunion professionnels. 

Tu reçois une transcription brute d'un enregistrement audio de réunion. Cette transcription peut contenir :
- Des hésitations ("euh", "hum", "alors", "donc")
- Des répétitions
- Des phrases incomplètes ou mal structurées
- Des erreurs de transcription
- Un manque de ponctuation
- Des mots mal transcrits
- Des bruits de fond ou interruptions

TÂCHE :
Transforme cette transcription en un compte rendu de réunion professionnel, structuré et clair, en respectant le contenu original mais en améliorant :

1. **Nettoyage du texte** :
   - Supprime les hésitations et répétitions inutiles
   - Corrige les erreurs de transcription évidentes
   - Améliore la ponctuation et la structure des phrases
   - Rétablis les majuscules et la casse appropriée

2. **Structuration professionnelle** :
   - Organise le contenu en sections logiques si possible :
     * Ordre du jour / Points abordés
     * Décisions prises
     * Actions à réaliser
     * Points à clarifier / Questions ouvertes
     * Prochaines étapes
   - Utilise des titres de section clairs (h2 ou h3)
   - Structure les listes avec des puces ou numérotation

3. **Amélioration du style** :
   - Utilise un langage professionnel mais naturel
   - Formule les décisions de manière claire et factuelle
   - Formule les actions avec des verbes à l'infinitif
   - Assure la cohérence et la fluidité du texte

4. **Préservation du contenu** :
   - Garde TOUT le contenu important et pertinent
   - Ne supprime pas les informations essentielles
   - Préserve les noms, dates, chiffres et détails importants
   - Maintiens le sens original des discussions

FORMAT DE SORTIE :
Le compte rendu doit être en HTML avec :
- Des balises <h2> ou <h3> pour les titres de sections
- Des balises <p> pour les paragraphes
- Des balises <ul> et <li> pour les listes à puces
- Des balises <ol> et <li> pour les listes numérotées
- Un style professionnel et lisible

IMPORTANT :
- Si le contenu ne permet pas d'identifier clairement des sections, organise-le de manière logique avec des paragraphes clairs
- Ne crée pas de sections vides si le contenu ne le justifie pas
- Le compte rendu doit être prêt à être utilisé directement dans PILOTYS

Transcription brute :
"""
${rawTranscript}
"""

Compte rendu professionnel amélioré (en HTML) :`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en rédaction de comptes rendus de réunion professionnels. Tu transformes les transcriptions brutes d'audio en comptes rendus structurés, clairs et professionnels en HTML, en préservant tout le contenu important.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2, // Température très basse pour maximiser la fidélité au contenu original
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[meetings/transcribe-audio] Erreur amélioration texte:", errorText);
      // Fallback sur formatage basique
      return formatBasicTranscript(rawTranscript);
    }

    const data = await response.json();
    const improvedText = data.choices[0]?.message?.content || rawTranscript;

    return improvedText;
  } catch (error) {
    console.error("[meetings/transcribe-audio] Erreur lors de l'amélioration:", error);
    // Fallback sur formatage basique
    return formatBasicTranscript(rawTranscript);
  }
}

/**
 * Formatage basique du texte si OpenAI n'est pas disponible
 */
function formatBasicTranscript(text: string): string {
  // Nettoyage basique : supprimer les répétitions évidentes, améliorer la ponctuation
  let cleaned = text
    .replace(/\s+/g, " ") // Espaces multiples
    .replace(/\s*([.,!?;:])\s*/g, "$1 ") // Ponctuation
    .replace(/\s*,\s*/g, ", ") // Virgules
    .trim();

  // Ajouter des retours à la ligne après les points si la phrase suivante commence par une majuscule
  cleaned = cleaned.replace(/\.\s+([A-Z])/g, ".\n\n$1");

  return cleaned;
}

