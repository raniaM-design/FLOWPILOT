import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/flowpilot-auth/password";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

// Forcer le runtime Node.js pour garantir la compatibilité avec Prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    // Validation
    if (!email || !password) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email et mot de passe requis"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (password.length < 8) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Le mot de passe doit contenir au moins 8 caractères"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Vérifier que DATABASE_URL est configurée
    if (!process.env.DATABASE_URL) {
      console.error("[auth/signup] DATABASE_URL n'est pas configurée");
      throw new Error("DATABASE_URL n'est pas définie. Vérifiez votre fichier .env.local ou les variables d'environnement Vercel.");
    }
    
    // En production, forcer PostgreSQL
    if (process.env.NODE_ENV === "production") {
      if (!process.env.DATABASE_URL.startsWith("postgresql://") && !process.env.DATABASE_URL.startsWith("postgres://")) {
        console.error("[auth/signup] DATABASE_URL a un format invalide en production:", process.env.DATABASE_URL.substring(0, 30));
        throw new Error("En production, DATABASE_URL doit utiliser PostgreSQL. Format attendu: postgresql://user:password@host:5432/database?schema=public");
      }
    }

    // Check if user exists (sélection minimale pour éviter les erreurs si preferredLanguage n'existe pas)
    let existingUser;
    try {
      existingUser = await Promise.race([
        prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            // On ignore preferredLanguage pour cette vérification
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout de connexion à la base de données")), 10000)
        ),
      ]);
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("[auth/signup] Erreur de base de données lors de la vérification:", {
        message: errorMessage,
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta,
      });
      
      if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
        throw new Error("La base de données n'est pas accessible. Vérifiez votre connexion réseau.");
      } else if (errorMessage.includes("P1000") || errorMessage.includes("Authentication failed")) {
        throw new Error("Erreur d'authentification à la base de données. Vérifiez vos identifiants.");
      } else if (errorMessage.includes("Timeout")) {
        throw new Error("La connexion à la base de données a expiré. Veuillez réessayer.");
      } else {
        throw new Error(`Erreur de base de données: ${errorMessage}`);
      }
    }

    if (existingUser) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Cet email est déjà utilisé"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await Promise.race([
        prisma.user.create({
          data: {
            email,
            passwordHash,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout de connexion à la base de données")), 10000)
        ),
      ]);
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("[auth/signup] Erreur de base de données lors de la création:", {
        message: errorMessage,
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta,
      });
      
      if (errorMessage.includes("P1001") || errorMessage.includes("Can't reach database")) {
        throw new Error("La base de données n'est pas accessible. Vérifiez votre connexion réseau.");
      } else if (errorMessage.includes("P1000") || errorMessage.includes("Authentication failed")) {
        throw new Error("Erreur d'authentification à la base de données. Vérifiez vos identifiants.");
      } else if (errorMessage.includes("Timeout")) {
        throw new Error("La connexion à la base de données a expiré. Veuillez réessayer.");
      } else if ((dbError as any)?.code === "P2002") {
        // Contrainte unique violée (email déjà utilisé)
        const baseUrl = new URL(request.url);
        const errorUrl = new URL("/signup", baseUrl.origin);
        errorUrl.searchParams.set("error", encodeURIComponent("Cet email est déjà utilisé"));
        return NextResponse.redirect(errorUrl, { status: 303 });
      } else {
        throw new Error(`Erreur de base de données: ${errorMessage}`);
      }
    }

    // Create session
    const token = await signSessionToken(user.id);
    const baseUrl = new URL(request.url);
    const response = NextResponse.redirect(new URL("/app", baseUrl.origin), { status: 303 });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("[auth/signup] Erreur lors de l'inscription:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[auth/signup] Détails de l'erreur:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      hasJwtSecret: !!process.env.FLOWPILOT_JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    });
    
    const baseUrl = new URL(request.url);
    const errorUrl = new URL("/signup", baseUrl.origin);
    // En développement, afficher plus de détails
    const userMessage = process.env.NODE_ENV === "development" 
      ? `Erreur: ${errorMessage}` 
      : "Une erreur est survenue. Veuillez réessayer.";
    errorUrl.searchParams.set("error", encodeURIComponent(userMessage));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

