import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/flowpilot-auth/session";
import {
  getBotPilotSystemPrompt,
  setBotPilotSystemPrompt,
} from "@/lib/bot-pilot/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mondayStart(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weekKey(d: Date): string {
  const m = mondayStart(d);
  return m.toISOString().slice(0, 10);
}

function weekLabelFr(monday: Date): string {
  return monday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

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
        { status: 403 }
      ),
    };
  }
  return { session };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  since30.setHours(0, 0, 0, 0);

  const since8w = new Date();
  since8w.setDate(since8w.getDate() - 56);
  since8w.setHours(0, 0, 0, 0);

  const [
    sessionAgg,
    feedbacksWeek,
    negativeLatest,
    systemPrompt,
  ] = await Promise.all([
    prisma.botPilotSessionRating.aggregate({
      where: { createdAt: { gte: since30 } },
      _avg: { stars: true },
      _count: { _all: true },
    }),
    prisma.botPilotMessageFeedback.findMany({
      where: { createdAt: { gte: since8w } },
      select: { rating: true, createdAt: true },
    }),
    prisma.botPilotMessageFeedback.findMany({
      where: { rating: "negative" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        messageContent: true,
        comment: true,
        createdAt: true,
      },
    }),
    getBotPilotSystemPrompt(),
  ]);

  const weekMap = new Map<
    string,
    { positive: number; negative: number; monday: Date }
  >();

  for (const f of feedbacksWeek) {
    const mon = mondayStart(f.createdAt);
    const key = weekKey(f.createdAt);
    if (!weekMap.has(key)) {
      weekMap.set(key, { positive: 0, negative: 0, monday: mon });
    }
    const b = weekMap.get(key)!;
    if (f.rating === "positive") b.positive += 1;
    else if (f.rating === "negative") b.negative += 1;
  }

  const weeklyThumbs = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      week: weekLabelFr(v.monday),
      positive: v.positive,
      negative: v.negative,
    }));

  return NextResponse.json({
    sessionAverage30d: sessionAgg._avg.stars ?? null,
    sessionCount30d: sessionAgg._count._all,
    weeklyThumbs,
    negativeLatest,
    systemPrompt,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = await request.json();
    const systemPrompt =
      typeof body.systemPrompt === "string" ? body.systemPrompt : null;
    if (systemPrompt === null || systemPrompt.length > 120_000) {
      return NextResponse.json({ error: "Prompt invalide" }, { status: 400 });
    }
    await setBotPilotSystemPrompt(systemPrompt);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/bot-pilot PATCH]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
