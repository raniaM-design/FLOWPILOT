import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPasswordResetToken, markTokenAsUsed } from "@/lib/flowpilot-auth/password-reset";
import { hashPassword } from "@/lib/flowpilot-auth/password";
import { sendPasswordResetConfirmationEmail } from "@/lib/email";
import { getLocaleFromRequest } from "@/i18n/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = String(formData.get("token") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérifier le token
    const tokenData = await verifyPasswordResetToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(password);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash },
    });

    // Marquer le token comme utilisé
    await markTokenAsUsed(tokenData.id);

    // Récupérer l'email de l'utilisateur pour l'email de confirmation
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { email: true },
    });

    // Envoyer l'email de confirmation
    if (user) {
      try {
        const locale = await getLocaleFromRequest();
        await sendPasswordResetConfirmationEmail(user.email, locale);
      } catch (emailError) {
        console.error("[auth/reset-password] Erreur lors de l'envoi de l'email de confirmation:", emailError);
        // Ne pas faire échouer la réinitialisation si l'email échoue
      }
    }

    return NextResponse.json(
      { message: "Votre mot de passe a été réinitialisé avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[auth/reset-password] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur s'est produite. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

