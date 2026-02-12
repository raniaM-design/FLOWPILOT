import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { DEFAULT_CRITICAL_DAYS, DEFAULT_MONITOR_DAYS } from "@/lib/decisions/decision-thresholds";

/**
 * GET - Récupérer les seuils de décision de l'utilisateur
 */
export async function GET() {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { decisionCriticalDays: true, decisionMonitorDays: true },
    });
    return NextResponse.json({
      criticalDays: user?.decisionCriticalDays ?? DEFAULT_CRITICAL_DAYS,
      monitorDays: user?.decisionMonitorDays ?? DEFAULT_MONITOR_DAYS,
    });
  } catch (error) {
    console.error("[decision-thresholds] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des seuils" },
      { status: 500 }
    );
  }
}

/**
 * POST - Sauvegarder les seuils de décision de l'utilisateur
 * Body: { criticalDays: number, monitorDays: number }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const body = await request.json();
    const { criticalDays, monitorDays } = body;

    if (typeof criticalDays !== "number" || criticalDays < 0 || criticalDays > 365) {
      return NextResponse.json(
        { error: "criticalDays doit être un nombre entre 0 et 365" },
        { status: 400 }
      );
    }
    if (typeof monitorDays !== "number" || monitorDays < 0 || monitorDays > 365) {
      return NextResponse.json(
        { error: "monitorDays doit être un nombre entre 0 et 365" },
        { status: 400 }
      );
    }
    if (monitorDays < criticalDays) {
      return NextResponse.json(
        { error: "À surveiller doit être supérieur ou égal à Critique" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        decisionCriticalDays: criticalDays,
        decisionMonitorDays: monitorDays,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[decision-thresholds] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des seuils" },
      { status: 500 }
    );
  }
}
