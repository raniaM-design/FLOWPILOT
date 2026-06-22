import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isSupport } from "@/lib/flowpilot-auth/support";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie, setImpersonatorCookie } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getReturnUrl(request: Request, baseUrl: URL): URL {
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const ref = new URL(referer);
      if (ref.origin === baseUrl.origin) return ref;
    } catch {
      // ignore invalid referer
    }
  }
  return new URL("/admin", baseUrl.origin);
}

function redirectWithError(request: Request, message: string) {
  const baseUrl = new URL(request.url);
  const returnUrl = getReturnUrl(request, baseUrl);
  returnUrl.searchParams.set("error", encodeURIComponent(message));
  return NextResponse.redirect(returnUrl, { status: 303 });
}

/**
 * Route API pour se connecter en tant qu'un autre utilisateur (impersonation)
 * Redirige vers /app avec les cookies de session (comme le login)
 */
export async function POST(request: Request) {
  try {
    const baseUrl = new URL(request.url);

    const session = await getSession();
    if (!session) {
      return redirectWithError(request, "Non authentifié");
    }

    const userIsSupport = await isSupport(session.userId);
    if (!userIsSupport) {
      return redirectWithError(request, "Accès refusé. Droits support requis.");
    }

    const formData = await request.formData();
    const targetUserId = String(formData.get("userId") ?? "");

    if (!targetUserId) {
      return redirectWithError(request, "ID utilisateur requis");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return redirectWithError(request, "Utilisateur non trouvé");
    }

    const impersonationToken = await signSessionToken(targetUserId);
    const response = NextResponse.redirect(new URL("/app", baseUrl.origin), { status: 303 });

    setImpersonatorCookie(response, session.userId);
    setSessionCookie(response, impersonationToken);

    return response;
  } catch (error) {
    console.error("[support/impersonate] Erreur:", error);
    return redirectWithError(request, "Erreur lors de l'impersonation");
  }
}
