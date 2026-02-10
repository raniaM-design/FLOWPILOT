import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route de diagnostic pour vérifier les variables d'environnement OAuth
 * GET /api/debug/oauth-env
 */
export async function GET() {
  const baseUrl = new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  
  // Vérifier toutes les variables pertinentes
  const env = {
    APP_URL: process.env.APP_URL || "❌ Non défini",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
    VERCEL_URL: process.env.VERCEL_URL || "❌ Non défini",
    NODE_ENV: process.env.NODE_ENV || "❌ Non défini",
    VERCEL: process.env.VERCEL || "❌ Non défini",
  };
  
  // Calculer l'origin qui serait utilisé
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  let computedOrigin: string;
  
  if (appUrl) {
    computedOrigin = appUrl;
  } else if (process.env.VERCEL_URL) {
    computedOrigin = `https://${process.env.VERCEL_URL}`;
  } else {
    computedOrigin = baseUrl.origin;
  }
  
  const redirectUri = `${computedOrigin}/api/auth/google/callback`;
  
  return NextResponse.json({
    environment: env,
    computed: {
      origin: computedOrigin,
      redirectUri,
      usedVariable: appUrl ? (process.env.APP_URL ? "APP_URL" : "NEXT_PUBLIC_APP_URL") : (process.env.VERCEL_URL ? "VERCEL_URL" : "request.origin"),
    },
    recommendation: appUrl 
      ? "✅ Configuration correcte - utilise le domaine personnalisé"
      : "⚠️ Ajoutez APP_URL ou NEXT_PUBLIC_APP_URL sur Vercel avec la valeur https://pilotys.io",
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

