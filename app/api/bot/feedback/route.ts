import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_SNIPPET = 8000;
const MAX_COMMENT = 4000;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const messageId =
      typeof body.messageId === "string" ? body.messageId.trim() : "";
    const rating = body.rating === "positive" || body.rating === "negative"
      ? body.rating
      : null;
    const rawComment =
      typeof body.comment === "string" ? body.comment.slice(0, MAX_COMMENT) : "";
    const commentTrim = rawComment.trim();
    const messageContent =
      typeof body.messageContent === "string"
        ? body.messageContent.slice(0, MAX_MESSAGE_SNIPPET)
        : "";

    if (!messageId || !rating) {
      return NextResponse.json(
        { error: "messageId et rating requis" },
        { status: 400 }
      );
    }

    if (rating === "negative" && !commentTrim) {
      return NextResponse.json(
        { error: "commentaire requis pour un avis négatif" },
        { status: 400 }
      );
    }

    await prisma.botPilotMessageFeedback.upsert({
      where: {
        userId_clientMessageId: {
          userId: session.userId,
          clientMessageId: messageId,
        },
      },
      create: {
        userId: session.userId,
        clientMessageId: messageId,
        messageContent: messageContent || "(vide)",
        rating,
        comment: rating === "negative" ? commentTrim : null,
      },
      update: {
        rating,
        messageContent: messageContent || "(vide)",
        comment: rating === "negative" ? commentTrim : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bot/feedback]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
