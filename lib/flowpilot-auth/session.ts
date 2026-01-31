// lib/flowpilot-auth/session.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./jwt";

export const COOKIE_NAME = "flowpilot_session";

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  // Détecter si on est en HTTPS (production Vercel)
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";
  // En local, on utilise secure: false pour permettre HTTP
  // En production Vercel, on utilise secure: true seulement si HTTPS explicite
  const useSecure = isProduction && (isVercel || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https"));
  
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: useSecure ?? false, // Secure seulement si HTTPS explicite en production
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  };
  
  response.cookies.set(COOKIE_NAME, token, cookieOptions);
  
  // Log pour déboguer (toujours actif pour diagnostiquer)
  console.log("[session] Cookie défini:", {
    name: COOKIE_NAME,
    hasToken: !!token,
    tokenLength: token.length,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
    isProduction,
    isVercel,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    cookieSet: !!response.cookies.get(COOKIE_NAME)?.value,
    cookieValue: response.cookies.get(COOKIE_NAME)?.value?.substring(0, 20) + "...",
  });
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