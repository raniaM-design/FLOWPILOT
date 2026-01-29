import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/flowpilot-auth/password";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

// Forcer le runtime Node.js pour garantir la compatibilité avec Prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/login", url.origin));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email et mot de passe requis"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Vérifier que DATABASE_URL est configurée
    if (!process.env.DATABASE_URL) {
      console.error("[auth/login] DATABASE_URL n'est pas configurée");
      throw new Error("DATABASE_URL n'est pas définie. Vérifiez votre fichier .env.local ou les variables d'environnement Vercel.");
    }
    
    // En production, forcer PostgreSQL
    if (process.env.NODE_ENV === "production") {
      if (!process.env.DATABASE_URL.startsWith("postgresql://") && !process.env.DATABASE_URL.startsWith("postgres://")) {
        console.error("[auth/login] DATABASE_URL a un format invalide en production:", process.env.DATABASE_URL.substring(0, 30));
        throw new Error("En production, DATABASE_URL doit utiliser PostgreSQL. Format attendu: postgresql://user:password@host:5432/database?schema=public");
      }
    }

    // Sélection minimale pour l'auth : éviter de charger preferredLanguage si la colonne n'existe pas encore
    let user;
    try {
      // Test de connexion avec un timeout
      user = await Promise.race([
        prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            // preferredLanguage n'est pas nécessaire pour l'auth, on l'ignore volontairement ici
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout de connexion à la base de données")), 10000)
        ),
      ]);
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("[auth/login] Erreur de base de données:", {
        message: errorMessage,
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      });
      
      // Messages d'erreur plus spécifiques
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

    if (!user) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email ou mot de passe incorrect"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Vérifier que passwordHash existe
    if (!user.passwordHash) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Compte invalide. Veuillez contacter le support."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const baseUrl = new URL(request.url);
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email ou mot de passe incorrect"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const token = await signSessionToken(user.id);

    const baseUrl = new URL(request.url);
    const response = NextResponse.redirect(
      new URL("/app", baseUrl.origin),
      { status: 303 }
    );

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("[auth/login] Erreur lors de la connexion:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[auth/login] Détails de l'erreur:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      hasJwtSecret: !!process.env.FLOWPILOT_JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    });
    
    const baseUrl = new URL(request.url);
    const errorUrl = new URL("/login", baseUrl.origin);
    // En développement, afficher plus de détails
    const userMessage = process.env.NODE_ENV === "development" 
      ? `Erreur: ${errorMessage}` 
      : "Une erreur s'est produite. Veuillez réessayer.";
    errorUrl.searchParams.set("error", encodeURIComponent(userMessage));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}
