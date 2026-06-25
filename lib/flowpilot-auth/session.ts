// lib/flowpilot-auth/session.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./jwt";

export const COOKIE_NAME = "flowpilot_session";
export const IMPERSONATOR_COOKIE_NAME = "flowpilot_impersonator";
export const DEMO_FLAG_COOKIE_NAME = "flowpilot_demo_mode";

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";
  const useSecure =
    isVercel || (isProduction && process.env.NEXT_PUBLIC_APP_URL?.startsWith("https"));

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: useSecure ?? false,
    maxAge: 60 * 60 * 24 * 30,
  };
}

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  const cookieOptions = getCookieOptions();

  response.cookies.set(COOKIE_NAME, token, cookieOptions);

  console.log("[session] Cookie défini:", {
    name: COOKIE_NAME,
    hasToken: !!token,
    tokenLength: token.length,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });
}

/**
 * Clear the session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  const cookieOptions = getCookieOptions();

  response.cookies.set(COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

/**
 * Stocke l'ID de l'admin/support qui impersonne un utilisateur
 */
export function setImpersonatorCookie(response: NextResponse, impersonatorId: string): void {
  response.cookies.set(IMPERSONATOR_COOKIE_NAME, impersonatorId, getCookieOptions());
}

/**
 * Supprime le cookie d'impersonation
 */
export function clearImpersonatorCookie(response: NextResponse): void {
  const cookieOptions = getCookieOptions();
  response.cookies.set(IMPERSONATOR_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

export function setDemoModeCookie(response: NextResponse): void {
  response.cookies.set(DEMO_FLAG_COOKIE_NAME, "1", getCookieOptions());
}

export function clearDemoModeCookie(response: NextResponse): void {
  const cookieOptions = getCookieOptions();
  response.cookies.set(DEMO_FLAG_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

export async function isDemoModeCookieSet(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_FLAG_COOKIE_NAME)?.value === "1";
}

/**
 * Lit l'ID de l'admin/support en mode impersonation
 */
export async function getImpersonatorId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATOR_COOKIE_NAME)?.value ?? null;
}

/**
 * Read and verify the session cookie from a request
 * Retourne l'ID utilisateur si valide, sinon null.
 * Ne doit JAMAIS faire crasher le middleware : en cas d'erreur → null.
 */
export async function readSessionCookie(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const userId = await verifySessionToken(token);

    if (!userId) {
      return null;
    }

    return userId;
  } catch (err) {
    console.error("[session] Error while reading/verifying session cookie:", err);
    return null;
  }
}

/**
 * Get session from cookies (for Server Components and API routes)
 * Returns session object with userId, or null if not authenticated
 */
export async function getSession(): Promise<{ userId: string } | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const userId = await verifySessionToken(token);
  if (!userId) {
    return null;
  }

  return { userId };
}