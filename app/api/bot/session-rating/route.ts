import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMMENT = 4000;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const stars = Number(body.stars);
    const comment =
      typeof body.comment === "string"
        ? body.comment.trim().slice(0, MAX_COMMENT)
        : undefined;

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "stars doit être entre 1 et 5" }, { status: 400 });
    }

    await prisma.botPilotSessionRating.create({
      data: {
        userId: session.userId,
        stars,
        comment: comment || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bot/session-rating]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
