import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 400;

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Droits administrateur requis." },
        { status: 403 },
      ),
    };
  }
  return { session };
}

/**
 * GET /api/admin/user-reviews
 * Liste des avis : notations de session Pilot (étoiles) et retours 👍/👎 sur les réponses.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const [sessionRatings, messageFeedbacks] = await Promise.all([
    prisma.botPilotSessionRating.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.botPilotMessageFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    sessionRatings: sessionRatings.map((r) => ({
      id: r.id,
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      userEmail: r.user.email,
      userName: r.user.name,
    })),
    messageFeedbacks: messageFeedbacks.map((f) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      messageContent: f.messageContent,
      createdAt: f.createdAt.toISOString(),
      userEmail: f.user.email,
      userName: f.user.name,
    })),
  });
}
