import OpenAI from "openai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const openai = new OpenAI();
  const formData = await req.formData();
  const chunk = formData.get("chunk") as File;
  if (!chunk) return Response.json({ error: "Aucun fichier reçu" }, { status: 400 });

  const transcription = await openai.audio.transcriptions.create({
    file: chunk,
    model: "whisper-1",
    language: "fr",
    response_format: "text",
  });

  return Response.json({ text: transcription });
}
