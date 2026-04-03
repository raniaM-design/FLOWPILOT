import { NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/public-app-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route de debug pour vérifier les variables d'environnement Resend sur Vercel
 * Visitez: https://votre-domaine.vercel.app/api/debug/resend-env
 */
export async function GET() {
  const resendKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || null;
  const emailFromValid = emailFrom && emailFrom.includes("@") && emailFrom.split("@").length === 2;
  const emailFromDomain = emailFrom && emailFrom.includes("@") ? emailFrom.split("@")[1] : null;

  const appUrlUsed = getPublicAppUrl();
  const appUrlCorrect = appUrlUsed === "https://pilotys.io" || appUrlUsed === "https://pilotys.io/";
  
  return NextResponse.json({
    message: "Variables d'environnement Resend",
    environment: {
      RESEND_API_KEY: resendKey ? "✅ Configuré (non vide après trim)" : "❌ Manquant ou vide",
      RESEND_API_KEY_PREFIX_OK: resendKey.startsWith("re_") ? "✅ Commence par re_" : "❌ Invalide",
      RESEND_API_KEY_LENGTH: resendKey ? resendKey.length : 0,
      EMAIL_FROM: emailFrom || "❌ Non défini",
      EMAIL_FROM_VALID: emailFromValid ? "✅ Valide" : "❌ Invalide ou manquant",
      EMAIL_FROM_DOMAIN: emailFromDomain || "❌ Non détecté",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "❌ Non défini",
      APP_URL: process.env.APP_URL || "❌ Non défini",
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || "❌ Non défini",
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "❌ Non défini",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
      APP_URL_RESOLVED: appUrlUsed || "❌ Non défini",
      APP_URL_CORRECT: appUrlCorrect ? "✅ Correct (pilotys.io)" : "⚠️ Utilise un autre domaine",
      NODE_ENV: process.env.NODE_ENV || "❌ Non défini",
      VERCEL: process.env.VERCEL || "❌ Non défini",
    },
    validation: {
      resendConfigured: resendKey.length > 0 && resendKey.startsWith("re_"),
      fromEmailConfigured: !!emailFrom,
      fromEmailValid: emailFromValid,
      domainVerified: emailFromDomain === "pilotys.io" || emailFromDomain === "resend.dev",
      appUrlCorrect: appUrlCorrect,
    },
    hints: [
      "Dans Vercel → Logs, cherchez les lignes JSON `phase: resend_invoke_before` puis `resend_send_accepted` (ou `resend_invoke_exception`). Si aucune ligne Resend : la route n’atteint pas sendEmail (user inconnu, 429, erreur avant).",
      "Vérifiez que RESEND_API_KEY et EMAIL_FROM sont configurées sur Vercel pour Production (sans guillemets ni espaces parasites).",
      resendKey && !resendKey.startsWith("re_")
        ? "⚠️ RESEND_API_KEY doit commencer par re_ (clé API complète, pas l’ID du domaine)."
        : null,
      emailFrom && !emailFromValid ? `⚠️ EMAIL_FROM invalide: "${emailFrom}" (doit être au format: user@domain.com)` : null,
      emailFromDomain && emailFromDomain !== "pilotys.io" && emailFromDomain !== "resend.dev" 
        ? `⚠️ Le domaine "${emailFromDomain}" doit être vérifié dans Resend Dashboard → Domains` 
        : null,
      !appUrlCorrect && appUrlUsed
        ? `⚠️ URL résolue pour les emails : "${appUrlUsed}". Pour la prod, définissez APP_URL=https://votre-domaine.com (et/ou NEXT_PUBLIC_URL) sur Vercel — sinon les liens peuvent pointer vers *.vercel.app.`
        : null,
    ].filter(Boolean),
  });
}

