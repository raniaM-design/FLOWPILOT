import { NextResponse } from "next/server";
import { prisma, ensurePrismaConnection } from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/flowpilot-auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { getLocaleFromRequest } from "@/i18n/request";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { normalizeEmail } from "@/lib/flowpilot-auth/email-normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const baseUrl = new URL(request.url);
  
  try {
    const formData = await request.formData();
    const email = normalizeEmail(String(formData.get("email") ?? ""));

    if (!email) {
      const errorUrl = new URL("/forgot-password", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email requis"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errorUrl = new URL("/forgot-password", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Format d'email invalide"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Connexion DB avec retries (Neon cold start / P1001), comme login/signup
    await ensurePrismaConnection(3);

    // Trouver l'utilisateur (sans révéler si l'email existe)
    // Insensible à la casse : en base l’email peut être ex. @hotmail.Fr alors que la saisie est @hotmail.fr
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true },
    });

    // Message de succès générique (ne pas révéler si l'email existe)
    // Cela évite l'énumération d'emails
    const successMessage = "Si cet email existe, vous recevrez un lien de réinitialisation.";

    if (!user) {
      // Attendre un peu pour éviter le timing attack
      await new Promise((resolve) => setTimeout(resolve, 500));
      const successUrl = new URL("/forgot-password", baseUrl.origin);
      successUrl.searchParams.set("success", encodeURIComponent(successMessage));
      return NextResponse.redirect(successUrl, { status: 303 });
    }

    // Vérifier que le service d'email est configuré avant de continuer
    const hasResend = !!process.env.RESEND_API_KEY?.trim();
    const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    if (!hasResend && !hasSmtp) {
      console.error("[auth/forgot-password] ❌ Aucun service d'email configuré (RESEND_API_KEY ou SMTP manquant)");
      const errorUrl = new URL("/forgot-password", baseUrl.origin);
      errorUrl.searchParams.set(
        "error",
        encodeURIComponent(
          "Le service d'email n'est pas configuré. Contactez l'administrateur (contact@pilotys.com)."
        )
      );
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Générer le token de réinitialisation
    const { token, tokenHash } = await generatePasswordResetToken();

    // Calculer la date d'expiration (1 heure)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    // Note: Le client Prisma sera régénéré après la migration
    await (prisma as any).passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Stocker le token hashé en base
    await (prisma as any).passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Récupérer la locale pour l'email
    const locale = await getLocaleFromRequest();

    // Envoyer l'email de réinitialisation
    try {
      const key = process.env.RESEND_API_KEY?.trim() ?? "";
      console.log(
        JSON.stringify({
          source: "auth/forgot-password",
          ts: new Date().toISOString(),
          phase: "before_sendPasswordResetEmail",
          recipientDomain: user.email.includes("@")
            ? user.email.split("@")[1]
            : null,
          hasResendKey: key.length > 0,
          resendKeyStartsWithRe: key.startsWith("re_"),
          resendKeyLength: key.length,
          emailFrom: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || null,
          publicAppUrl: getPublicAppUrl(),
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL,
        }),
      );
      console.log("[auth/forgot-password] 📧 Appel sendPasswordResetEmail → lib/email (Resend ou SMTP)");

      await sendPasswordResetEmail(user.email, token, locale);

      console.log(
        JSON.stringify({
          source: "auth/forgot-password",
          ts: new Date().toISOString(),
          phase: "after_sendPasswordResetEmail_ok",
        }),
      );
      console.log("[auth/forgot-password] ✅ sendPasswordResetEmail terminé sans throw");
    } catch (emailError: any) {
      console.error("[auth/forgot-password] ❌ Erreur lors de l'envoi de l'email:", emailError);
      console.error("[auth/forgot-password] ❌ Stack:", emailError.stack);
      console.error("[auth/forgot-password] Détails:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        name: emailError.name,
      });
      
      const errorUrl = new URL("/forgot-password", baseUrl.origin);
      errorUrl.searchParams.set(
        "error",
        encodeURIComponent(
          "Impossible d'envoyer l'email de réinitialisation. Vérifiez votre connexion et réessayez. Si le problème persiste, contactez le support à contact@pilotys.com."
        )
      );
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const successUrl = new URL("/forgot-password", baseUrl.origin);
    successUrl.searchParams.set("success", encodeURIComponent(successMessage));
    return NextResponse.redirect(successUrl, { status: 303 });
  } catch (error) {
    console.error("[auth/forgot-password] Erreur:", error);
    const errorUrl = new URL("/forgot-password", baseUrl.origin);
    errorUrl.searchParams.set("error", encodeURIComponent("Une erreur s'est produite. Veuillez réessayer."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

