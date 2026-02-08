import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { sanitizeString, isValidEmail } from "@/lib/security/input-validation";

/**
 * GET /api/user/profile
 * Récupérer le profil de l'utilisateur actuel
 */
export async function GET() {
  try {
    const userId = await getCurrentUserIdOrThrow();
    
    let user;
    try {
      // Essayer d'abord avec avatarUrl
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          preferredLanguage: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (fieldError: any) {
      // Si avatarUrl n'existe pas encore, réessayer sans
      if (
        fieldError?.message?.includes("avatarUrl") ||
        fieldError?.code === "P2009"
      ) {
        console.warn("[api/user/profile] ⚠️ Champ avatarUrl non disponible, récupération sans ce champ");
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            preferredLanguage: true,
            createdAt: true,
            updatedAt: true,
          },
        }) as any;
        // Ajouter avatarUrl null si absent
        if (user) {
          user.avatarUrl = null;
        }
      } else {
        throw fieldError;
      }
    }
    
    if (!user) {
      console.error("[api/user/profile] GET - Utilisateur non trouvé, userId:", userId);
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[api/user/profile] GET error:", {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
    });
    
    // Message d'erreur plus spécifique
    let errorMessage = "Erreur lors de la récupération du profil";
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      errorMessage = "Base de données indisponible";
    } else if (error?.code === "P2025") {
      errorMessage = "Utilisateur non trouvé";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Mettre à jour le profil de l'utilisateur actuel
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const body = await request.json();
    
    const { name, avatarUrl } = body;
    
    // Validation
    const updates: any = {};
    
    if (name !== undefined) {
      const sanitizedName = sanitizeString(name);
      if (sanitizedName.length > 100) {
        return NextResponse.json(
          { error: "Le nom ne peut pas dépasser 100 caractères" },
          { status: 400 }
        );
      }
      updates.name = sanitizedName || null;
    }
    
    if (avatarUrl !== undefined) {
      const sanitizedAvatarUrl = sanitizeString(avatarUrl);
      // Valider que c'est une URL valide
      if (sanitizedAvatarUrl && !sanitizedAvatarUrl.match(/^https?:\/\/.+/)) {
        return NextResponse.json(
          { error: "L'URL de l'avatar doit être une URL valide" },
          { status: 400 }
        );
      }
      updates.avatarUrl = sanitizedAvatarUrl || null;
    }
    
    // Mettre à jour l'utilisateur
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          preferredLanguage: true,
          updatedAt: true,
        } as any,
      });
    } catch (updateError: any) {
      // Si avatarUrl n'existe pas encore, réessayer sans
      if (
        updateError?.message?.includes("avatarUrl") ||
        updateError?.code === "P2009"
      ) {
        console.warn("[api/user/profile] ⚠️ Champ avatarUrl non disponible, mise à jour sans ce champ");
        const updatesWithoutAvatar = { ...updates };
        delete updatesWithoutAvatar.avatarUrl;
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updatesWithoutAvatar,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            preferredLanguage: true,
            updatedAt: true,
          } as any,
        }) as any;
        updatedUser.avatarUrl = null;
      } else {
        throw updateError;
      }
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[api/user/profile] PATCH error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}

