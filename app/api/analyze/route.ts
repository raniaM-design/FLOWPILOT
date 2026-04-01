import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export type AnalysisResult = {
  decisions: Array<{
    id: string;
    texte: string;
    auteur: string;
    date_effet: string;
  }>;
  actions: Array<{
    id: string;
    texte: string;
    responsable: string;
    deadline: string;
    priorite: string;
  }>;
  points_surveillance: Array<{
    id: string;
    texte: string;
    risque: string;
    proprietaire: string;
  }>;
  resume_executif: string;
};

const SYSTEM_PROMPT = `Tu es un analyste de comptes rendus de réunion.

Tu dois répondre UNIQUEMENT avec un objet JSON valide : pas de markdown, pas de backticks, pas de texte avant ou après.

Structure obligatoire (remplis les chaînes selon le texte ; tableaux vides autorisés avec []) :

{
  "decisions": [{"id": "d1", "texte": "", "auteur": "", "date_effet": ""}],
  "actions": [{"id": "a1", "texte": "", "responsable": "", "deadline": "", "priorite": "haute|moyenne|basse"}],
  "points_surveillance": [{"id": "p1", "texte": "", "risque": "", "proprietaire": ""}],
  "resume_executif": ""
}

Règles :
- priorite pour chaque action : exactement une des valeurs "haute", "moyenne" ou "basse" (ou chaîne vide si inconnu).
- Génère des id uniques (d1, d2, a1, p1, etc.).
- Si aucun élément pour une liste, retourne [].`;

function parseModelJson(content: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(content) as unknown };
  } catch {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { ok: false };
      }
      return { ok: true, data: JSON.parse(jsonMatch[0]) as unknown };
    } catch {
      return { ok: false };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY non configurée sur le serveur." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as unknown;
    if (typeof body !== "object" || body === null || !("text" in body)) {
      return NextResponse.json(
        { error: "Corps JSON attendu : { \"text\": string }" },
        { status: 400 }
      );
    }

    const text = String((body as { text: unknown }).text ?? "");
    if (!text.trim()) {
      return NextResponse.json({ error: "Le champ « text » ne peut pas être vide." }, { status: 400 });
    }

    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Texte à analyser :\n\n${text}`,
          },
        ],
      }),
    });

    const rawResponse = await completion.json();

    if (!completion.ok) {
      const errMsg =
        typeof rawResponse?.error?.message === "string"
          ? rawResponse.error.message
          : JSON.stringify(rawResponse);
      return NextResponse.json({ error: errMsg }, { status: completion.status });
    }

    const content = rawResponse?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        {
          error: "Parsing JSON échoué",
          raw: String(content ?? ""),
        },
        { status: 500 }
      );
    }

    const parsed = parseModelJson(content.trim());
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Parsing JSON échoué", raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data as AnalysisResult);
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : "Erreur serveur lors de l’analyse. Réessayez ou vérifiez les logs.";
    console.error("[api/analyze]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
