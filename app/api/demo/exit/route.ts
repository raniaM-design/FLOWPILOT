import { NextResponse } from "next/server";
import {
  clearDemoModeCookie,
  clearSessionCookie,
  getSession,
  isDemoModeCookieSet,
} from "@/lib/flowpilot-auth/session";
import { isDemoUserId } from "@/lib/demo/seed-demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quitte le mode démo et retourne à la landing.
 * POST /api/demo/exit
 */
export async function POST(request: Request) {
  const baseUrl = new URL(request.url);
  const landingUrl = new URL("/", baseUrl.origin);

  try {
    const session = await getSession();
    const demoCookie = await isDemoModeCookieSet();
    const isDemoUser = session ? await isDemoUserId(session.userId) : false;

    if (!demoCookie && !isDemoUser) {
      return NextResponse.redirect(landingUrl, { status: 303 });
    }

    const response = NextResponse.redirect(landingUrl, { status: 303 });
    clearSessionCookie(response);
    clearDemoModeCookie(response);
    return response;
  } catch (error) {
    console.error("[demo/exit] Erreur:", error);
    const response = NextResponse.redirect(landingUrl, { status: 303 });
    clearSessionCookie(response);
    clearDemoModeCookie(response);
    return response;
  }
}
