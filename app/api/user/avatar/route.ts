import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/db";

/**
 * POST /api/user/avatar
 * Upload une photo de profil
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }
    
    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image ne peut pas dépasser 5MB" },
        { status: 400 }
      );
    }
    
    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Générer un nom de fichier unique
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${userId}-${Date.now()}.${extension}`;
    
    // Créer le dossier public/avatars s'il n'existe pas
    const uploadDir = join(process.cwd(), "public", "avatars");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Sauvegarder le fichier
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    // Générer l'URL publique
    const avatarUrl = `/avatars/${filename}`;
    
    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    
    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("[api/user/avatar] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'avatar" },
      { status: 500 }
    );
  }
}

