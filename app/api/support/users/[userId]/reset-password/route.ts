import { NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isSupport, resetUserPassword } from "@/lib/flowpilot-auth/support";
import { hashPassword } from "@/lib/flowpilot-auth/password";
import { isValidPassword } from "@/lib/security/input-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route API pour réinitialiser le mot de passe d'un utilisateur (support uniquement)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Vérifier l'authentification
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier les droits support
    const userIsSupport = await isSupport(session.userId);
    if (!userIsSupport) {
      return NextResponse.json(
        { error: "Accès refusé. Droits support requis." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const newPassword = String(formData.get("password") ?? "");

    const passwordValidation = isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || "Mot de passe invalide" },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Réinitialiser le mot de passe
    await resetUserPassword(userId, passwordHash);

    return NextResponse.json({
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error: any) {
    console.error("[support/reset-password] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
}

