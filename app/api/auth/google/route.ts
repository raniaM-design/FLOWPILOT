import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google
 * Redirige vers Google OAuth pour l'authentification
 */
export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url);
  
  // Déterminer l'origin à utiliser
  // Sur Vercel, utiliser VERCEL_URL pour preview ou le domaine de production
  let origin: string;
  
  if (process.env.VERCEL_URL) {
    // Vercel preview ou production
    origin = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    // Domaine personnalisé configuré
    origin = process.env.NEXT_PUBLIC_APP_URL;
  } else {
    // Fallback sur l'origin de la requête
    origin = baseUrl.origin;
  }
  
  // Vérifier les variables d'environnement
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("[auth/google] ❌ Variables d'environnement Google manquantes");
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", encodeURIComponent("Configuration OAuth Google manquante. Veuillez contacter le support."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  
  // Log pour diagnostic
  console.log("[auth/google] Configuration OAuth:", {
    requestOrigin: baseUrl.origin,
    computedOrigin: origin,
    redirectUri,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  // Générer l'URL d'autorisation
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent", // Forcer le consentement pour obtenir le refresh token
  });
  
  console.log("[auth/google] URL d'autorisation générée:", authUrl.substring(0, 100) + "...");

  // Stocker le client OAuth dans un cookie sécurisé pour le callback
  const response = NextResponse.redirect(authUrl, { status: 303 });
  
  // Stocker l'état dans un cookie httpOnly pour la sécurité
  const state = crypto.randomUUID();
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  return response;
}

