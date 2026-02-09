import { NextResponse } from "next/server";
import { prisma, ensurePrismaConnection } from "@/lib/db";
import { hashPassword } from "@/lib/flowpilot-auth/password";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

// Forcer le runtime Node.js pour garantir la compatibilité avec Prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const baseUrl = new URL(request.url);
  
  try {
    console.log("[auth/signup] Variables d'environnement:", {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.FLOWPILOT_JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      jwtSecretLength: process.env.FLOWPILOT_JWT_SECRET?.length || 0,
    });
    
    // Vérifier les variables d'environnement critiques AVANT de traiter la requête
    const missingVars: string[] = [];
    
    if (!process.env.DATABASE_URL) {
      console.error("[auth/signup] ❌ DATABASE_URL manquante");
      missingVars.push("DATABASE_URL");
    }

    if (!process.env.FLOWPILOT_JWT_SECRET) {
      console.error("[auth/signup] ❌ FLOWPILOT_JWT_SECRET manquant");
      missingVars.push("FLOWPILOT_JWT_SECRET");
    }
    
    if (missingVars.length > 0) {
      const errorUrl = new URL("/signup", baseUrl.origin);
      const errorMessage = `Configuration serveur incomplète. Variable${missingVars.length > 1 ? "s" : ""} manquante${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}. Veuillez contacter le support.`;
      errorUrl.searchParams.set("error", encodeURIComponent(errorMessage));
      console.error("[auth/signup] Variables manquantes:", missingVars);
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // Validation
    if (!email || !password || !confirmPassword) {
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Tous les champs sont requis"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (password.length < 8) {
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Le mot de passe doit contenir au moins 8 caractères"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (password !== confirmPassword) {
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Les mots de passe ne correspondent pas"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // S'assurer que la connexion Prisma est établie (avec retries pour cold starts)
    // Note: On ne teste pas les tables ici, les erreurs de schéma seront détectées lors des vraies requêtes
    try {
      await ensurePrismaConnection(3);
      console.log("[auth/signup] ✅ Connexion Prisma établie avec succès");
    } catch (connectionError: any) {
      const errorCode = connectionError?.code;
      const errorMessage = connectionError instanceof Error ? connectionError.message : String(connectionError);
      
      // Logs détaillés pour diagnostic (toujours visibles dans les logs Vercel)
      console.error("[auth/signup] ❌ Impossible d'établir la connexion à la base de données:", {
        code: errorCode,
        message: errorMessage,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 50) + "...",
        isPostgres: process.env.DATABASE_URL?.startsWith("postgresql://") || process.env.DATABASE_URL?.startsWith("postgres://"),
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        stack: connectionError?.stack?.substring(0, 500),
      });
      
      const errorUrl = new URL("/signup", baseUrl.origin);
      
      // Messages d'erreur spécifiques selon le type d'erreur
      if (errorCode === "P1000" || errorMessage.includes("Authentication failed")) {
        // Erreur d'authentification
        console.error("[auth/signup] ❌ Erreur d'authentification - DATABASE_URL incorrecte");
        errorUrl.searchParams.set("error", encodeURIComponent("Erreur de configuration de la base de données. Veuillez contacter le support."));
      } else if (errorCode === "P1003" || (errorMessage.includes("database") && errorMessage.includes("does not exist"))) {
        // Base de données n'existe pas
        console.error("[auth/signup] ❌ La base de données n'existe pas");
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
      } else if (errorCode === "MISSING_DATABASE_URL") {
        // DATABASE_URL manquante
        console.error("[auth/signup] ❌ DATABASE_URL manquante");
        errorUrl.searchParams.set("error", encodeURIComponent("Configuration serveur incomplète. Veuillez contacter le support."));
      } else {
        // Erreur générique (probablement P1001 - cold start Neon)
        console.error("[auth/signup] ❌ Erreur de connexion générique - Code:", errorCode, "Message:", errorMessage);
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
      }
      
      return NextResponse.redirect(errorUrl, { status: 303 });
    }
    
    // Vérifier si l'utilisateur existe déjà
    // Note: ensurePrismaConnection a déjà vérifié que la connexion et les tables existent
    let existingUser;
    let dbError: any = null;
    try {
      existingUser = await Promise.race([
        prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 15000)
        ),
      ]);
    } catch (error: any) {
      dbError = error;
      // Si on a une erreur après ensurePrismaConnection, c'est grave
      console.error("[auth/signup] ❌ Erreur inattendue après connexion établie:", {
        code: error?.code,
        message: error instanceof Error ? error.message : String(error),
        stack: error?.stack,
      });
    }
    
    // Si on a une erreur, la traiter
    if (dbError && !existingUser) {
      const errorCode = dbError?.code;
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      
      // Logs détaillés pour diagnostic (toujours actifs en production)
      console.error("[auth/signup] Erreur DB lors de la vérification:", {
        code: errorCode,
        message: errorMessage,
        stack: dbError?.stack,
        // Informations sur la configuration
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.substring(0, 20) + "..." : "not set",
        isPostgres: process.env.DATABASE_URL?.startsWith("postgresql://") || 
                   process.env.DATABASE_URL?.startsWith("postgres://"),
        isSqlite: process.env.DATABASE_URL?.startsWith("file:"),
        nodeEnv: process.env.NODE_ENV,
      });
      
      const errorUrl = new URL("/signup", baseUrl.origin);
      
      // Gérer les erreurs selon leur type
      if (errorCode === "P1012" || errorMessage.includes("schema") || errorMessage.includes("relation") || errorMessage.includes("does not exist")) {
        // Erreur de schéma - migrations non appliquées
        console.error("[auth/signup] ❌ Erreur de schéma détectée - Les migrations ne sont pas appliquées");
        console.error("[auth/signup] 💡 Code d'erreur:", errorCode);
        console.error("[auth/signup] 💡 Message:", errorMessage);
        console.error("[auth/signup] 💡 Solution: Exécutez 'npm run db:deploy' ou 'npx prisma migrate deploy'");
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas configurée. Les migrations doivent être appliquées. Veuillez contacter le support."));
      } else if (errorCode === "P1001" || errorMessage.includes("Can't reach database") || errorMessage.includes("ECONNREFUSED")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
      } else if (errorCode === "P1000" || errorMessage.includes("Authentication failed") || errorMessage.includes("password authentication")) {
        // Erreur d'authentification - probablement DATABASE_URL mal configurée
        console.error("[auth/signup] ❌ Erreur d'authentification DB - Vérifiez DATABASE_URL sur Vercel");
        errorUrl.searchParams.set("error", encodeURIComponent("Erreur de configuration de la base de données. Veuillez contacter le support."));
      } else if (errorCode === "P1003" || (errorMessage.includes("does not exist") && errorMessage.includes("database"))) {
        // Base de données n'existe pas
        console.error("[auth/signup] ❌ Base de données n'existe pas");
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
      } else if (errorMessage === "TIMEOUT" || errorMessage.includes("timeout")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La connexion a pris trop de temps. Veuillez réessayer."));
      } else {
        errorUrl.searchParams.set("error", encodeURIComponent("Erreur de connexion à la base de données. Veuillez réessayer."));
      }
      
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (existingUser) {
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Cet email est déjà utilisé"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer le hash du mot de passe
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      console.error("[auth/signup] Erreur lors du hashage du mot de passe:", error);
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Erreur lors du traitement. Veuillez réessayer."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer l'utilisateur
    let user: { id: string; email: string } | null = null;
    try {
      // Essayer d'abord avec tous les champs requis
      user = await Promise.race([
        prisma.user.create({
          data: { 
            email, 
            passwordHash,
            authProvider: "password", // Marquer comme authentification par mot de passe
            // S'assurer que les champs optionnels avec valeurs par défaut sont explicitement définis
            displayReduceAnimations: false,
          },
          select: { id: true, email: true },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 15000)
        ),
      ]);
    } catch (dbError: any) {
      const errorCode = dbError?.code;
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      
      // Logs détaillés pour diagnostic (toujours actifs en production)
      // Logs séparés pour meilleure visibilité dans Vercel
      console.error("===========================================");
      console.error("[auth/signup] ❌ ERREUR DB LORS DE LA CRÉATION");
      console.error("[auth/signup] Code d'erreur:", errorCode || "NON FOURNI");
      console.error("[auth/signup] Message:", errorMessage);
      console.error("[auth/signup] DATABASE_URL existe:", !!process.env.DATABASE_URL);
      console.error("[auth/signup] DATABASE_URL preview:", process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + "..." : "NOT SET");
      console.error("[auth/signup] Is PostgreSQL:", process.env.DATABASE_URL?.startsWith("postgresql://") || 
                   process.env.DATABASE_URL?.startsWith("postgres://"));
      console.error("[auth/signup] Stack:", dbError?.stack?.substring(0, 500));
      console.error("===========================================");
      
      // Logs structurés aussi pour faciliter le parsing
      console.error("[auth/signup] Erreur DB structurée:", {
        code: errorCode,
        message: errorMessage,
        stack: dbError?.stack?.substring(0, 500),
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.substring(0, 50) + "..." : "not set",
        isPostgres: process.env.DATABASE_URL?.startsWith("postgresql://") || 
                   process.env.DATABASE_URL?.startsWith("postgres://"),
        isSqlite: process.env.DATABASE_URL?.startsWith("file:"),
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
      });
      
      const errorUrl = new URL("/signup", baseUrl.origin);
      
      if (errorCode === "P2002") {
        // Email déjà utilisé (race condition)
        errorUrl.searchParams.set("error", encodeURIComponent("Cet email est déjà utilisé"));
        return NextResponse.redirect(errorUrl, { status: 303 });
      } else if (errorCode === "P1001" || errorMessage.includes("Can't reach database") || errorMessage.includes("ECONNREFUSED")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
        return NextResponse.redirect(errorUrl, { status: 303 });
      } else if (errorCode === "P1000" || errorMessage.includes("Authentication failed") || errorMessage.includes("password authentication")) {
        // Erreur d'authentification - probablement DATABASE_URL mal configurée
        console.error("[auth/signup] ❌ Erreur d'authentification DB - Vérifiez DATABASE_URL sur Vercel");
        errorUrl.searchParams.set("error", encodeURIComponent("Erreur de configuration de la base de données. Veuillez contacter le support."));
        return NextResponse.redirect(errorUrl, { status: 303 });
      } else if (errorCode === "P1003" || (errorMessage.includes("database") && errorMessage.includes("does not exist"))) {
        // Base de données n'existe pas
        console.error("[auth/signup] ❌ Base de données n'existe pas - Code:", errorCode);
        console.error("[auth/signup] ❌ Message complet:", errorMessage);
        console.error("[auth/signup] ❌ Stack:", dbError?.stack?.substring(0, 500));
        console.error("[auth/signup] 💡 Vérifiez que DATABASE_URL pointe vers la bonne base de données");
        console.error("[auth/signup] 💡 DATABASE_URL preview:", process.env.DATABASE_URL?.substring(0, 50) + "...");
        errorUrl.searchParams.set("error", encodeURIComponent("La base de données n'est pas accessible. Veuillez réessayer dans quelques instants."));
        return NextResponse.redirect(errorUrl, { status: 303 });
      } else if (errorCode === "P2022" || (errorMessage.includes("isCompanyAdmin") && errorMessage.includes("does not exist"))) {
        // Colonne manquante (ex: isCompanyAdmin) - essayer sans cette colonne
        console.error("[auth/signup] ⚠️ Colonne isCompanyAdmin manquante, tentative de création sans ce champ");
        try {
          user = await prisma.user.create({
            data: { 
              email, 
              passwordHash,
            },
            select: { id: true, email: true },
          });
          console.log("[auth/signup] ✅ Utilisateur créé avec succès (sans isCompanyAdmin)");
        } catch (retryError: any) {
          console.error("[auth/signup] ❌ Échec du retry:", retryError);
          errorUrl.searchParams.set("error", encodeURIComponent("Erreur de configuration de la base de données. Veuillez contacter le support."));
          return NextResponse.redirect(errorUrl, { status: 303 });
        }
      } else if (errorCode === "P1012" || errorMessage.includes("schema") || errorMessage.includes("column") || (errorMessage.includes("does not exist") && !errorMessage.includes("database"))) {
        // Erreur de schéma - migration manquante
        console.error("[auth/signup] ⚠️ Erreur de schéma détectée, tentative de création sans champs problématiques");
        try {
          // Retry sans les champs qui pourraient causer problème
          user = await prisma.user.create({
            data: { 
              email, 
              passwordHash,
            },
            select: { id: true, email: true },
          });
          console.log("[auth/signup] ✅ Utilisateur créé avec succès (sans champs optionnels)");
        } catch (retryError: any) {
          console.error("[auth/signup] ❌ Échec du retry:", retryError);
          errorUrl.searchParams.set("error", encodeURIComponent("Erreur de configuration de la base de données. Veuillez contacter le support."));
          return NextResponse.redirect(errorUrl, { status: 303 });
        }
      } else if (errorMessage === "TIMEOUT" || errorMessage.includes("timeout")) {
        errorUrl.searchParams.set("error", encodeURIComponent("La connexion a pris trop de temps. Veuillez réessayer."));
        return NextResponse.redirect(errorUrl, { status: 303 });
      } else {
        // Dernière tentative sans champs optionnels
        console.error("[auth/signup] ⚠️ Erreur inconnue, tentative de création minimale");
        try {
          user = await prisma.user.create({
            data: { 
              email, 
              passwordHash,
            },
            select: { id: true, email: true },
          });
          console.log("[auth/signup] ✅ Utilisateur créé avec succès (création minimale)");
        } catch (finalError: any) {
          console.error("[auth/signup] ❌ Échec final:", finalError);
          errorUrl.searchParams.set("error", encodeURIComponent(`Erreur lors de la création du compte: ${errorMessage}. Veuillez réessayer ou contacter le support.`));
          return NextResponse.redirect(errorUrl, { status: 303 });
        }
      }
    }

    // Vérifier que l'utilisateur a bien été créé
    if (!user) {
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Erreur lors de la création du compte. Veuillez réessayer."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer le token de session
    let token: string;
    try {
      token = await signSessionToken(user.id);
    } catch (error) {
      console.error("[auth/signup] Erreur lors de la création du token:", error);
      const errorUrl = new URL("/signup", baseUrl.origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Erreur lors de la création de la session. Veuillez réessayer."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer la réponse avec le cookie de session
    const response = NextResponse.redirect(new URL("/app", baseUrl.origin), { status: 303 });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("[auth/signup] Erreur inattendue:", error);
    const errorUrl = new URL("/signup", baseUrl.origin);
    errorUrl.searchParams.set("error", encodeURIComponent("Une erreur est survenue. Veuillez réessayer."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

