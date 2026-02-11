import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route de debug pour vérifier les variables d'environnement Resend sur Vercel
 * Visitez: https://votre-domaine.vercel.app/api/debug/resend-env
 */
export async function GET() {
  const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || null;
  const emailFromValid = emailFrom && emailFrom.includes("@") && emailFrom.split("@").length === 2;
  const emailFromDomain = emailFrom && emailFrom.includes("@") ? emailFrom.split("@")[1] : null;
  
  // URL utilisée dans les emails (priorité: APP_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL)
  const appUrlUsed = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const appUrlCorrect = appUrlUsed === "https://pilotys.io" || appUrlUsed === "https://pilotys.io/";
  
  return NextResponse.json({
    message: "Variables d'environnement Resend",
    environment: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "✅ Configuré" : "❌ Manquant",
      EMAIL_FROM: emailFrom || "❌ Non défini",
      EMAIL_FROM_VALID: emailFromValid ? "✅ Valide" : "❌ Invalide ou manquant",
      EMAIL_FROM_DOMAIN: emailFromDomain || "❌ Non détecté",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "❌ Non défini",
      APP_URL: process.env.APP_URL || "❌ Non défini",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
      APP_URL_USED: appUrlUsed || "❌ Non défini",
      APP_URL_CORRECT: appUrlCorrect ? "✅ Correct (pilotys.io)" : "⚠️ Utilise un autre domaine",
      NODE_ENV: process.env.NODE_ENV || "❌ Non défini",
      VERCEL: process.env.VERCEL || "❌ Non défini",
    },
    validation: {
      resendConfigured: !!process.env.RESEND_API_KEY,
      fromEmailConfigured: !!emailFrom,
      fromEmailValid: emailFromValid,
      domainVerified: emailFromDomain === "pilotys.io" || emailFromDomain === "resend.dev",
      appUrlCorrect: appUrlCorrect,
    },
    hints: [
      "Vérifiez que RESEND_API_KEY et EMAIL_FROM sont configurées sur Vercel pour Production",
      emailFrom && !emailFromValid ? `⚠️ EMAIL_FROM invalide: "${emailFrom}" (doit être au format: user@domain.com)` : null,
      emailFromDomain && emailFromDomain !== "pilotys.io" && emailFromDomain !== "resend.dev" 
        ? `⚠️ Le domaine "${emailFromDomain}" doit être vérifié dans Resend Dashboard → Domains` 
        : null,
      !appUrlCorrect && appUrlUsed ? `⚠️ L'URL utilisée dans les emails est "${appUrlUsed}" au lieu de "https://pilotys.io". Configurez APP_URL=https://pilotys.io sur Vercel.` : null,
    ].filter(Boolean),
  });
}

