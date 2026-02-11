/**
 * Génère un compte rendu professionnel à partir d'une transcription audio
 * Supporte l'anonymisation des données sensibles
 */

/**
 * Anonymise les données sensibles dans un texte
 */
export function anonymizeSensitiveData(text: string): string {
  // Anonymiser emails
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email anonymisé]");
  
  // Anonymiser numéros de téléphone (format FR)
  text = text.replace(/\b0[1-9](?:[.\s-]?\d{2}){4}\b/g, "[téléphone anonymisé]");
  text = text.replace(/\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g, "[téléphone anonymisé]");
  
  // Anonymiser IBAN (format FR)
  text = text.replace(/\bFR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/gi, "[IBAN anonymisé]");
  
  // Anonymiser numéros de carte bancaire (16 chiffres)
  text = text.replace(/\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b/g, "[carte anonymisée]");

  return text;
}

/**
 * Génère un compte rendu professionnel à partir d'une transcription brute
 * @param rawTranscript - Texte transcrit brut
 * @param options - Options de génération
 */
export async function generateProfessionalMeetingMinutes(
  rawTranscript: string,
  options: {
    anonymize?: boolean;
  } = {}
): Promise<string> {
  // Anonymiser si demandé
  let textToProcess = rawTranscript;
  if (options.anonymize) {
    textToProcess = anonymizeSensitiveData(rawTranscript);
  }

  // Si OpenAI est disponible, utiliser pour améliorer le texte
  if (process.env.OPENAI_API_KEY) {
    try {
      return await improveTranscriptWithAI(textToProcess);
    } catch (error) {
      console.error("[professional-minutes-generator] Erreur amélioration AI, fallback sur formatage basique:", error);
      return formatBasicTranscript(textToProcess);
    }
  }

  // Sinon, formatage basique
  return formatBasicTranscript(textToProcess);
}

/**
 * Améliore le texte transcrit avec OpenAI pour générer un compte rendu professionnel
 */
async function improveTranscriptWithAI(rawTranscript: string): Promise<string> {
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
   - Préserve les noms, dates, chiffres et détails importants (sauf si déjà anonymisés)
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
    console.error("[professional-minutes-generator] Erreur amélioration texte:", errorText);
    throw new Error(`Erreur OpenAI: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || rawTranscript;
}

/**
 * Formatage basique du texte si OpenAI n'est pas disponible
 */
function formatBasicTranscript(text: string): string {
  // Nettoyage basique : supprimer les répétitions évidentes, améliorer la ponctuation
  let formatted = text
    .replace(/\s+/g, " ") // Normaliser les espaces
    .replace(/\s*([.,;:!?])\s*/g, "$1 ") // Espacer après ponctuation
    .replace(/\s*([.,;:!?])\s*([.,;:!?])/g, "$1$2") // Éviter double ponctuation
    .trim();

  // Diviser en paragraphes (lignes vides ou phrases longues)
  const sentences = formatted.split(/(?<=[.!?])\s+/);
  const paragraphs: string[] = [];
  let currentParagraph = "";

  for (const sentence of sentences) {
    if (currentParagraph.length + sentence.length > 500) {
      if (currentParagraph) {
        paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
      }
      currentParagraph = sentence;
    } else {
      currentParagraph += (currentParagraph ? " " : "") + sentence;
    }
  }

  if (currentParagraph) {
    paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
  }

  return paragraphs.join("\n") || `<p>${formatted}</p>`;
}

