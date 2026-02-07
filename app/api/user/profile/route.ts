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
    
    const user = await prisma.user.findUnique({
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
    
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("[api/user/profile] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
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
    const updates: { name?: string | null; avatarUrl?: string | null } = {};
    
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
    const updatedUser = await prisma.user.update({
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
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[api/user/profile] PATCH error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}

