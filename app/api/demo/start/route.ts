import { NextResponse } from "next/server";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import {
  clearImpersonatorCookie,
  setDemoModeCookie,
  setSessionCookie,
} from "@/lib/flowpilot-auth/session";
import { startDemoSession } from "@/lib/demo/seed-demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lance le mode démo : compte Sophie + projet, réunion et actions d'exemple.
 * GET /api/demo/start
 */
export async function GET(request: Request) {
  try {
    const userId = await startDemoSession();
    const token = await signSessionToken(userId);
    const baseUrl = new URL(request.url);
    const response = NextResponse.redirect(new URL("/app", baseUrl.origin), {
      status: 303,
    });

    clearImpersonatorCookie(response);
    setSessionCookie(response, token);
    setDemoModeCookie(response);

    return response;
  } catch (error) {
    console.error("[demo/start] Erreur:", error);
    const baseUrl = new URL(request.url);
    const landingUrl = new URL("/", baseUrl.origin);
    landingUrl.searchParams.set(
      "error",
      "Impossible de lancer la démo. Réessayez dans un instant.",
    );
    return NextResponse.redirect(landingUrl, { status: 303 });
  }
}
