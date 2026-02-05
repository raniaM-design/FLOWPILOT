import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { cookies } from "next/headers";
import { sign } from "@/lib/flowpilot-auth/jwt";
import { randomUUID } from "crypto";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si une connexion existe déjà
    const { prisma } = await import("@/lib/db");
    const existingAccount = await prisma.outlookAccount.findUnique({
      where: { userId },
      select: { email: true, connectedAt: true },
    });

    // Si une connexion existe, on la remplace automatiquement
    // (un seul compte Outlook par utilisateur)
    if (existingAccount && process.env.NODE_ENV === "development") {
      console.log(`[outlook-connect] Replacing existing Outlook connection for user ${userId}`, {
        existingEmail: existingAccount.email,
        connectedAt: existingAccount.connectedAt,
      });
    }

    // Générer un state unique pour CSRF protection
    // Combiner un UUID unique avec un JWT signé contenant userId
    const stateId = randomUUID();
    const stateToken = await sign({ userId, stateId, timestamp: Date.now() }, "1h");
    const state = `${stateId}:${stateToken}`;
    
    // Stocker le state dans un cookie httpOnly sécurisé
    // Détecter si on est sur Vercel (toujours HTTPS) ou en production HTTPS
    const isVercel = process.env.VERCEL === "1";
    const isProduction = process.env.NODE_ENV === "production";
    // Sur Vercel, toujours utiliser secure: true car Vercel utilise toujours HTTPS
    // En production non-Vercel, vérifier si l'URL commence par https
    const useSecure = isVercel || (isProduction && (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") || process.env.APP_URL?.startsWith("https")));
    
    const cookieStore = await cookies();
    cookieStore.set("outlook_oauth_state", state, {
      httpOnly: true,
      secure: useSecure ?? false,
      sameSite: "lax",
      path: "/",
      maxAge: 3600, // 1 heure
    });
    
    // Log pour diagnostic (toujours actif en production pour déboguer)
    console.log("[outlook-connect] Cookie OAuth state défini:", {
      hasState: !!state,
      stateLength: state.length,
      secure: useSecure ?? false,
      isVercel,
      isProduction,
      appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "not set",
    });

    // Log de debug (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-connect] state généré:", {
        stateId,
        stateLength: state.length,
        cookieSet: true,
      });
    }

    // Construire l'URL d'autorisation Microsoft
    // Lire les variables d'environnement DANS le handler (pas au top-level)
    // IMPORTANT: Utiliser "common" pour supporter comptes pro + comptes Microsoft personnels
    // Si MICROSOFT_TENANT_ID est défini, l'utiliser (pour compatibilité), sinon utiliser "common"
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    
    // Déterminer l'URL de redirection : utiliser la variable d'env ou détecter automatiquement
    let redirectUriRaw = process.env.MICROSOFT_REDIRECT_URI;
    if (!redirectUriRaw) {
      // Détection automatique de l'URL de production
      const vercelUrl = process.env.VERCEL_URL;
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
      
      if (vercelUrl) {
        // Vercel fournit VERCEL_URL (sans https://)
        // VERCEL_URL peut être le domaine preview ou production
        redirectUriRaw = `https://${vercelUrl}/api/outlook/callback`;
        console.log("[outlook-connect] Using VERCEL_URL for redirect URI:", redirectUriRaw);
      } else if (appUrl) {
        // Utiliser APP_URL si défini (priorité sur NEXT_PUBLIC_APP_URL)
        redirectUriRaw = `${appUrl.replace(/\/$/, "")}/api/outlook/callback`;
        console.log("[outlook-connect] Using APP_URL for redirect URI:", redirectUriRaw);
      } else if (process.env.NODE_ENV === "production") {
        // En production sans URL détectée, loguer une erreur
        console.error("[outlook-connect] ERROR: MICROSOFT_REDIRECT_URI not set in production");
        console.error("[outlook-connect] Available env vars:", {
          VERCEL_URL: process.env.VERCEL_URL || "not set",
          APP_URL: process.env.APP_URL || "not set",
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",
          NODE_ENV: process.env.NODE_ENV,
        });
        return NextResponse.json(
          { 
            error: "Configuration manquante",
            details: "MICROSOFT_REDIRECT_URI doit être défini en production. Ajoutez-le dans les variables d'environnement Vercel, ou définissez APP_URL ou NEXT_PUBLIC_APP_URL."
          },
          { status: 500 }
        );
      } else {
        // Développement local par défaut
        redirectUriRaw = "http://localhost:3000/api/outlook/callback";
        console.log("[outlook-connect] Using default localhost redirect URI");
      }
    }
    
    // Nettoyer redirect_uri : retirer trailing slash et espaces
    const redirectUri = redirectUriRaw.trim().replace(/\/$/, "");
    
    // Nettoyer scopes : retirer les guillemets si présents et normaliser
    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
    const scopesRaw = process.env.MICROSOFT_SCOPES || defaultScopes;
    const scopes = scopesRaw.trim().replace(/^["']|["']$/g, ""); // Retirer guillemets au début/fin

    // Log du tenant utilisé (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook] tenant:", tenantId);
      if (tenantId === "common") {
        console.log("[outlook] Using /common endpoint - supports both organizational and personal Microsoft accounts");
      } else {
        console.log("[outlook] Using tenant-specific endpoint - supports only accounts from this tenant");
      }
    }

    // Log de debug (dev + prod pour diagnostic)
    console.log("[outlook-connect] Configuration:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasTenantId: !!process.env.MICROSOFT_TENANT_ID,
      hasRedirectUriEnv: !!process.env.MICROSOFT_REDIRECT_URI,
      hasScopes: !!process.env.MICROSOFT_SCOPES,
      tenantId,
      redirectUri: redirectUri.substring(0, 50) + "...", // Masquer l'URL complète pour sécurité
      scopes,
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL || "not set",
      appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "not set",
      clientIdPreview: clientId ? clientId.substring(0, 8) + "..." : "UNDEFINED",
    });

    // Vérifier les variables requises et lister celles manquantes
    const missing: string[] = [];
    if (!clientId) missing.push("MICROSOFT_CLIENT_ID");
    // Note: clientSecret n'est pas requis pour /connect, seulement pour /callback

    if (missing.length > 0) {
      return NextResponse.json(
        { 
          error: "Configuration Microsoft manquante",
          missing,
          details: `Variables d'environnement manquantes: ${missing.join(", ")}`
        },
        { status: 500 }
      );
    }

    // À ce stade, clientId est garanti d'être défini (vérifié ci-dessus)
    // Construire l'URL d'autorisation Microsoft OAuth v2.0
    const authorizeBaseUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
    const authUrl = new URL(authorizeBaseUrl);
    
    // Validation et nettoyage des paramètres avant de les ajouter
    // Vérifier que clientId est un UUID valide (format Azure AD)
    if (!clientId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
      console.error("[outlook-connect] Invalid CLIENT_ID format:", clientId?.substring(0, 20));
      return NextResponse.json(
        { 
          error: "Configuration invalide",
          details: "MICROSOFT_CLIENT_ID doit être un UUID valide (format Azure AD)"
        },
        { status: 500 }
      );
    }
    
    // Vérifier que redirectUri est une URL valide
    try {
      new URL(redirectUri);
    } catch (e) {
      console.error("[outlook-connect] Invalid REDIRECT_URI:", redirectUri);
      return NextResponse.json(
        { 
          error: "Configuration invalide",
          details: `MICROSOFT_REDIRECT_URI n'est pas une URL valide: ${redirectUri}`
        },
        { status: 500 }
      );
    }
    
    // Vérifier que les scopes sont valides (pas de caractères spéciaux)
    if (!/^[a-zA-Z0-9._\s-]+$/.test(scopes)) {
      console.error("[outlook-connect] Invalid SCOPES format:", scopes);
      return NextResponse.json(
        { 
          error: "Configuration invalide",
          details: "MICROSOFT_SCOPES contient des caractères invalides"
        },
        { status: 500 }
      );
    }
    
    // Vérifier que le state ne contient pas de caractères problématiques
    // Le state contient un UUID et un JWT séparés par ":"
    if (!state || state.length > 2000) {
      console.error("[outlook-connect] Invalid STATE:", state?.substring(0, 50));
      return NextResponse.json(
        { 
          error: "Erreur interne",
          details: "Le paramètre state est invalide"
        },
        { status: 500 }
      );
    }
    
    // Paramètres OAuth requis (tous en string, pas d'array)
    // URLSearchParams.encode() sera appelé automatiquement par searchParams.set()
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri); // Doit correspondre exactement à Azure
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("scope", scopes); // String avec espaces entre scopes
    authUrl.searchParams.set("state", state);

    // Log pour diagnostic (dev + prod)
    console.log("[outlook-oauth] OAuth URL générée:", {
      baseUrl: authorizeBaseUrl,
      clientId: clientId.substring(0, 8) + "...",
      redirectUri: redirectUri,
      scope: scopes,
      tenant: tenantId,
      stateLength: state.length,
      fullUrlLength: authUrl.toString().length,
    });
    
    // Log de l'URL complète uniquement en dev (pour debug)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-oauth] Full authorize URL:", authUrl.toString());
    }

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Erreur lors de la connexion Outlook:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}

