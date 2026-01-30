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
  const baseUrl = new URL(request.url);
  
  try {
    // Vérifier les variables d'environnement critiques AVANT de traiter la requête
    if (!process.env.DATABASE_URL) {
      console.error("[auth/login] ❌ DATABASE_URL manquante");
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Configuration serveur incomplète. Veuillez contacter le support."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (!process.env.FLOWPILOT_JWT_SECRET) {
      console.error("[auth/login] ❌ FLOWPILOT_JWT_SECRET manquant");
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Configuration serveur incomplète. Veuillez contacter le support."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email et mot de passe requis"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Tentative de connexion à la base de données avec gestion d'erreur robuste
    let user;
    try {
      user = await Promise.race([
        prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 15000)
        ),
      ]);
    } catch (dbError: any) {
      const errorCode = dbError?.code;
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      
      console.error("[auth/login] Erreur DB:", {
        code: errorCode,
        message: errorMessage,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20),
      });
      
      const errorUrl = new URL("/login", baseUrl.origin);
      
      // Messages d'erreur spécifiques selon le code d'erreur Prisma
      if (errorCode === "P1001" || errorMessage.includes("Can't reach database") || errorMessage.includes("ECONNREFUSED")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
      } else if (errorCode === "P1000" || errorMessage.includes("Authentication failed") || errorMessage.includes("password authentication")) {
        errorUrl.searchParams.set("error", encodeURIComponent("Erreur de configuration de la base de données. Veuillez contacter le support."));
      } else if (errorCode === "P1003" || errorMessage.includes("database") && errorMessage.includes("does not exist")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'existe pas. Veuillez contacter le support."));
      } else if (errorMessage === "TIMEOUT" || errorMessage.includes("timeout")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La connexion a pris trop de temps. Veuillez réessayer."));
      } else {
        // Erreur générique mais informative
        errorUrl.searchParams.set("error", encodeURIComponent("Erreur de connexion à la base de données. Veuillez réessayer."));
      }
      
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (!user) {
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email ou mot de passe incorrect"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (!user.passwordHash) {
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Compte invalide. Veuillez contacter le support."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Vérifier le mot de passe
    let isValid: boolean;
    try {
      isValid = await verifyPassword(password, user.passwordHash);
    } catch (error) {
      console.error("[auth/login] Erreur lors de la vérification du mot de passe:", error);
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Erreur lors de la vérification. Veuillez réessayer."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (!isValid) {
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Email ou mot de passe incorrect"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer le token de session
    let token: string;
    try {
      token = await signSessionToken(user.id);
    } catch (error) {
      console.error("[auth/login] Erreur lors de la création du token:", error);
      const errorUrl = new URL("/login", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Erreur lors de la création de la session. Veuillez réessayer."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer la réponse avec le cookie de session
    const response = NextResponse.redirect(new URL("/app", baseUrl.origin), { status: 303 });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("[auth/login] Erreur inattendue:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const errorUrl = new URL("/login", baseUrl.origin);
    // Message générique pour l'utilisateur, détails dans les logs
    errorUrl.searchParams.set("error", encodeURIComponent("Une erreur s'est produite. Veuillez réessayer."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}
