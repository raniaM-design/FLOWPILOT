import { NextResponse } from "next/server";
import { getSession, getImpersonatorId, setSessionCookie, clearImpersonatorCookie } from "@/lib/flowpilot-auth/session";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quitte le mode impersonation et restaure la session de l'admin/support
 */
export async function POST(request: Request) {
  const baseUrl = new URL(request.url);

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", baseUrl.origin), { status: 303 });
    }

    const impersonatorId = await getImpersonatorId();
    if (!impersonatorId) {
      return NextResponse.redirect(new URL("/app", baseUrl.origin), { status: 303 });
    }

    const impersonator = await prisma.user.findUnique({
      where: { id: impersonatorId },
      select: { id: true, email: true, role: true },
    });

    if (!impersonator || (impersonator.role !== "ADMIN" && impersonator.role !== "SUPPORT")) {
      const errorUrl = new URL("/app", baseUrl.origin);
      errorUrl.searchParams.set("error", "Session d'impersonation invalide");
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const token = await signSessionToken(impersonatorId);
    const redirectPath = impersonator.role === "ADMIN" ? "/admin" : "/support";
    const response = NextResponse.redirect(new URL(redirectPath, baseUrl.origin), { status: 303 });

    setSessionCookie(response, token);
    clearImpersonatorCookie(response);

    return response;
  } catch (error) {
    console.error("[support/stop-impersonate] Erreur:", error);
    return NextResponse.redirect(new URL("/app", baseUrl.origin), { status: 303 });
  }
}
