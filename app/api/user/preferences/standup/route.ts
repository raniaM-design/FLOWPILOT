import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

const TZ_RE = /^[A-Za-z_]+\/[A-Za-z_]+$/;

function clampHour(n: unknown, fallback: number): number {
  const x = typeof n === "number" ? n : parseInt(String(n), 10);
  if (Number.isNaN(x) || x < 0 || x > 23) return fallback;
  return x;
}

function clampMinute(n: unknown, fallback: number): number {
  const x = typeof n === "number" ? n : parseInt(String(n), 10);
  if (Number.isNaN(x) || x < 0 || x > 59) return fallback;
  return x;
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
        standupWindowStartHour: true,
        standupWindowEndHour: true,
        standupReminderHour: true,
        standupReminderMinute: true,
        standupTimezone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      standupWindowStartHour: user.standupWindowStartHour,
      standupWindowEndHour: user.standupWindowEndHour,
      standupReminderHour: user.standupReminderHour,
      standupReminderMinute: user.standupReminderMinute,
      standupTimezone: user.standupTimezone || "Europe/Paris",
    });
  } catch (e) {
    console.error("[preferences/standup GET]", e);
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
    const start = clampHour(body.standupWindowStartHour, 7);
    let end = clampHour(body.standupWindowEndHour, 10);
    if (end < start) end = start;
    const rh = clampHour(body.standupReminderHour, 10);
    const rm = clampMinute(body.standupReminderMinute, 30);
    const tz =
      typeof body.standupTimezone === "string" && TZ_RE.test(body.standupTimezone)
        ? body.standupTimezone
        : "Europe/Paris";

    await prisma.user.update({
      where: { id: userId },
      data: {
        standupWindowStartHour: start,
        standupWindowEndHour: end,
        standupReminderHour: rh,
        standupReminderMinute: rm,
        standupTimezone: tz,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[preferences/standup POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
