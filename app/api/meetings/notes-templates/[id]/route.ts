import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const { id } = await context.params;

    const res = await prisma.meetingNotesTemplate.deleteMany({
      where: { id, userId },
    });

    if (res.count === 0) {
      return NextResponse.json({ error: "Modèle introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[notes-templates DELETE]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
