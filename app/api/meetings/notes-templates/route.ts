import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

const MAX_MARKDOWN = 48_000;
const MAX_NAME = 120;

export async function GET() {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const templates = await prisma.meetingNotesTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, bodyMarkdown: true, updatedAt: true },
    });
    return NextResponse.json({ templates });
  } catch (e) {
    console.error("[notes-templates GET]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const bodyMarkdown =
      typeof body.bodyMarkdown === "string" ? body.bodyMarkdown.trim() : "";

    if (!name || name.length > MAX_NAME) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }
    if (!bodyMarkdown || bodyMarkdown.length > MAX_MARKDOWN) {
      return NextResponse.json({ error: "Contenu du modèle invalide ou trop long" }, { status: 400 });
    }

    const created = await prisma.meetingNotesTemplate.create({
      data: { userId, name, bodyMarkdown },
      select: { id: true, name: true, bodyMarkdown: true },
    });

    return NextResponse.json({ template: created });
  } catch (e) {
    console.error("[notes-templates POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
