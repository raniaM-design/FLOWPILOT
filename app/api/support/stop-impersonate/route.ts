import { NextResponse } from "next/server";
import { getSession, getImpersonatorId, setSessionCookie, clearImpersonatorCookie } from "@/lib/flowpilot-auth/session";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quitte le mode impersonation et restaure la session de l'admin/support
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const impersonatorId = await getImpersonatorId();
    if (!impersonatorId) {
      return NextResponse.json(
        { error: "Aucune session d'impersonation active" },
        { status: 400 }
      );
    }

    const impersonator = await prisma.user.findUnique({
      where: { id: impersonatorId },
      select: { id: true, email: true, role: true },
    });

    if (!impersonator || (impersonator.role !== "ADMIN" && impersonator.role !== "SUPPORT")) {
      return NextResponse.json(
        { error: "Session d'impersonation invalide" },
        { status: 403 }
      );
    }

    const token = await signSessionToken(impersonatorId);
    const response = NextResponse.json({
      message: `Retour au compte ${impersonator.email}`,
      redirectTo: impersonator.role === "ADMIN" ? "/admin" : "/support",
    });

    setSessionCookie(response, token);
    clearImpersonatorCookie(response);

    return response;
  } catch (error) {
    console.error("[support/stop-impersonate] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sortie de l'impersonation" },
      { status: 500 }
    );
  }
}
