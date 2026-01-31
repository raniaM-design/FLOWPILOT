// lib/flowpilot-auth/session.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./jwt";

export const COOKIE_NAME = "flowpilot_session";

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";
  
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction || isVercel, // Secure en production et sur Vercel
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
  
  // Log en développement pour déboguer
  if (!isProduction) {
    console.log("[session] Cookie défini:", {
      name: COOKIE_NAME,
      hasToken: !!token,
      tokenLength: token.length,
      secure: isProduction || isVercel,
      sameSite: "lax",
      path: "/",
    });
  }
}

/**
 * Clear the session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
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