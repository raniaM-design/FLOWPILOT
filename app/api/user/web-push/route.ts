import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { isWebPushConfigured } from "@/lib/standup/send-standup-web-push";

function isValidSubscription(body: unknown): body is {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const keys = b.keys as Record<string, unknown> | undefined;
  return (
    typeof b.endpoint === "string" &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_WEBPUSH_VAPID_PUBLIC_KEY ??
    process.env.WEBPUSH_VAPID_PUBLIC_KEY ??
    null;
  return NextResponse.json({
    configured: isWebPushConfigured(),
    publicKey,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Web Push non configuré sur ce serveur" },
        { status: 503 },
      );
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    if (!isValidSubscription(body)) {
      return NextResponse.json({ error: "Souscription invalide" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { webPushSubscription: body },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[web-push POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { webPushSubscription: Prisma.DbNull },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[web-push DELETE]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
