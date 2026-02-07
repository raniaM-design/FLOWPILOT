/**
 * Protection CSRF renforcée
 */

import { NextRequest, NextResponse } from "next/server";

const CSRF_TOKEN_COOKIE = "csrf_token";
const CSRF_TOKEN_HEADER = "x-csrf-token";

/**
 * Générer un token CSRF
 */
export function generateCsrfToken(): string {
  // Générer un token aléatoire
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return token;
}

/**
 * Vérifier le token CSRF depuis une requête
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  // Les requêtes GET ne nécessitent pas de protection CSRF
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }
  
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  // Comparer les tokens (comparaison en temps constant pour éviter les attaques par timing)
  return constantTimeCompare(cookieToken, headerToken);
}

/**
 * Comparaison en temps constant pour éviter les attaques par timing
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Définir le cookie CSRF dans une réponse
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  const isProduction = process.env.NODE_ENV === "production";
  
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 3600 * 24, // 24 heures
  });
  
  return response;
}

