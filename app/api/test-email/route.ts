import { NextResponse } from "next/server";
import { testSMTPConnection } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour tester la configuration SMTP
 * GET /api/test-email
 * 
 * Utile pour vérifier la configuration SMTP sur Vercel
 */
export async function GET(request: Request) {
  try {
    // Vérifier les variables d'environnement
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || "❌ Non défini",
      SMTP_PORT: process.env.SMTP_PORT || "❌ Non défini",
      SMTP_USER: process.env.SMTP_USER || "❌ Non défini",
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "✅ Défini" : "❌ Non défini",
      SMTP_FROM: process.env.SMTP_FROM || "❌ Non défini",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
      APP_URL: process.env.APP_URL || "❌ Non défini",
      VERCEL_URL: process.env.VERCEL_URL || "❌ Non défini",
    };

    // Tester la connexion SMTP
    const connectionTest = await testSMTPConnection();

    return NextResponse.json({
      success: connectionTest.success,
      environment: envCheck,
      connection: connectionTest.success
        ? { status: "✅ Connexion réussie" }
        : { status: "❌ Échec", error: connectionTest.error },
    });
  } catch (error: any) {
    console.error("[test-email] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

