import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/flowpilot-auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { getLocaleFromRequest } from "@/i18n/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const baseUrl = new URL(request.url);
  
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

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

    // Trouver l'utilisateur (sans révéler si l'email existe)
    const user = await prisma.user.findUnique({
      where: { email },
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
      console.log("[auth/forgot-password] Tentative d'envoi d'email à:", user.email);
      await sendPasswordResetEmail(user.email, token, locale);
      console.log("[auth/forgot-password] ✅ Email envoyé avec succès");
    } catch (emailError: any) {
      console.error("[auth/forgot-password] ❌ Erreur lors de l'envoi de l'email:", emailError);
      console.error("[auth/forgot-password] Détails:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });
      
      // Ne pas faire échouer la requête si l'email échoue
      // Mais logger l'erreur pour investigation
      // En production, vous pourriez vouloir utiliser un service de logging
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

