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
  // Priorité : APP_URL ou NEXT_PUBLIC_APP_URL (domaine de production) > VERCEL_URL > origin de la requête
  let origin: string;
  
  // Vérifier d'abord APP_URL (variable serveur), puis NEXT_PUBLIC_APP_URL (variable publique)
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  
  // Log AVANT le calcul pour diagnostic
  console.log("[auth/google] 🔍 Variables d'environnement disponibles:", {
    APP_URL: process.env.APP_URL || "❌ Non défini",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
    VERCEL_URL: process.env.VERCEL_URL || "❌ Non défini",
    requestOrigin: baseUrl.origin,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  });
  
  if (appUrl) {
    // Domaine personnalisé configuré (priorité la plus haute)
    origin = appUrl;
    console.log(`[auth/google] ✅ Utilisation du domaine personnalisé: ${origin}`);
  } else if (process.env.VERCEL_URL) {
    // Vercel preview ou production (fallback)
    origin = `https://${process.env.VERCEL_URL}`;
    console.log(`[auth/google] ⚠️ Utilisation de VERCEL_URL (fallback): ${origin}`);
    console.log(`[auth/google] 💡 Pour utiliser pilotys.io, ajoutez APP_URL=https://pilotys.io sur Vercel`);
  } else {
    // Fallback sur l'origin de la requête (développement local)
    origin = baseUrl.origin;
    console.log(`[auth/google] 🔧 Utilisation de l'origin de la requête: ${origin}`);
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
    appUrl: process.env.APP_URL,
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
  
  // Configuration du cookie pour OAuth cross-site
  // Sur Vercel/production, utiliser sameSite: "none" avec secure: true
  // pour permettre la redirection depuis Google (cross-site)
  const isVercel = !!process.env.VERCEL;
  const isProduction = process.env.NODE_ENV === "production";
  const useSecure = isVercel || isProduction;
  const sameSiteValue = useSecure ? "none" : "lax";
  
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: useSecure,
    sameSite: sameSiteValue as "lax" | "none" | "strict",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  
  // Log pour diagnostic
  console.log("[auth/google] Cookie OAuth state défini:", {
    hasState: !!state,
    stateLength: state.length,
    secure: useSecure,
    sameSite: sameSiteValue,
    isVercel,
    isProduction,
    origin,
    redirectUri,
    statePreview: state.substring(0, 20) + "...",
  });

  return response;
}

