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
  const origin = baseUrl.origin;
  
  // Vérifier les variables d'environnement
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("[auth/google] ❌ Variables d'environnement Google manquantes");
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", encodeURIComponent("Configuration OAuth Google manquante. Veuillez contacter le support."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  
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

