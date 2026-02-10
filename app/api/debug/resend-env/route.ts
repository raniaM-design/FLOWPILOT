import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route de debug pour vérifier les variables d'environnement Resend sur Vercel
 * Visitez: https://votre-domaine.vercel.app/api/debug/resend-env
 */
export async function GET() {
  return NextResponse.json({
    message: "Variables d'environnement Resend",
    environment: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "✅ Configuré" : "❌ Manquant",
      EMAIL_FROM: process.env.EMAIL_FROM || "❌ Non défini",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "❌ Non défini",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
      APP_URL: process.env.APP_URL || "❌ Non défini",
      NODE_ENV: process.env.NODE_ENV || "❌ Non défini",
      VERCEL: process.env.VERCEL || "❌ Non défini",
    },
    hint: "Vérifiez que RESEND_API_KEY et EMAIL_FROM sont configurées sur Vercel pour Production",
  });
}

