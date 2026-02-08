import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma, ensurePrismaConnection } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/user/avatar
 * Upload une photo de profil (stockée en base64 dans la base de données)
 * Compatible avec Vercel serverless (pas de système de fichiers)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();
    
    // S'assurer que la connexion Prisma est établie
    await ensurePrismaConnection(3);
    
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
    
    // Vérifier la taille (max 2MB pour base64 - plus petit que 5MB car base64 augmente la taille)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "L'image ne peut pas dépasser 2MB" },
        { status: 400 }
      );
    }
    
    // Convertir le fichier en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    
    // Déterminer le type MIME
    const mimeType = file.type || "image/jpeg";
    
    // Créer l'URL data (data:image/jpeg;base64,...)
    const avatarUrl = `data:${mimeType};base64,${base64}`;
    
    // Mettre à jour l'utilisateur avec l'avatar en base64
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    
    console.log(`[api/user/avatar] ✅ Avatar uploadé pour l'utilisateur ${userId} (${Math.round(buffer.length / 1024)}KB)`);
    
    return NextResponse.json({ avatarUrl });
  } catch (error: any) {
    console.error("[api/user/avatar] ❌ Erreur lors de l'upload:", {
      error: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 500),
    });
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'avatar" },
      { status: 500 }
    );
  }
}

