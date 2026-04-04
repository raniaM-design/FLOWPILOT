import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

function clampHour(n: unknown, fallback: number): number {
  const x = typeof n === "number" ? n : parseInt(String(n), 10);
  if (Number.isNaN(x) || x < 0 || x > 23) return fallback;
  return x;
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyDigestDailyEnabled: true,
        notifyDigestDailyHour: true,
        notifyDigestDailyEmail: true,
        notifyDigestDailyPush: true,
        notifyDigestWeeklyEnabled: true,
        notifyDigestWeeklyHour: true,
        notifyDigestWeeklyEmail: true,
        notifyDigestWeeklyPush: true,
        notifyImmediateAssignEnabled: true,
        notifyImmediateBlockedEnabled: true,
        notifyStandupReminderEnabled: true,
        notifyStandupEmailEnabled: true,
        notifyStandupPushEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    console.error("[preferences/notifications GET]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    await prisma.user.update({
      where: { id: userId },
      data: {
        notifyDigestDailyEnabled: asBool(body.notifyDigestDailyEnabled, true),
        notifyDigestDailyHour: clampHour(body.notifyDigestDailyHour, 8),
        notifyDigestDailyEmail: asBool(body.notifyDigestDailyEmail, true),
        notifyDigestDailyPush: asBool(body.notifyDigestDailyPush, false),
        notifyDigestWeeklyEnabled: asBool(body.notifyDigestWeeklyEnabled, true),
        notifyDigestWeeklyHour: clampHour(body.notifyDigestWeeklyHour, 7),
        notifyDigestWeeklyEmail: asBool(body.notifyDigestWeeklyEmail, true),
        notifyDigestWeeklyPush: asBool(body.notifyDigestWeeklyPush, false),
        notifyImmediateAssignEnabled: asBool(body.notifyImmediateAssignEnabled, true),
        notifyImmediateBlockedEnabled: asBool(body.notifyImmediateBlockedEnabled, true),
        notifyStandupReminderEnabled: asBool(body.notifyStandupReminderEnabled, true),
        notifyStandupEmailEnabled: asBool(body.notifyStandupEmailEnabled, true),
        notifyStandupPushEnabled: asBool(body.notifyStandupPushEnabled, false),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[preferences/notifications POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
