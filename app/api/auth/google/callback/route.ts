import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma, ensurePrismaConnection } from "@/lib/db";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google/callback
 * Gère le callback de Google OAuth après authentification
 */
export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url);
  
  // Déterminer l'origin à utiliser (même logique que dans route.ts)
  let origin: string;
  
  if (process.env.VERCEL_URL) {
    // Vercel preview ou production
    origin = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    // Domaine personnalisé configuré
    origin = process.env.NEXT_PUBLIC_APP_URL;
  } else {
    // Fallback sur l'origin de la requête
    origin = baseUrl.origin;
  }
  
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // Vérifier les variables d'environnement
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("[auth/google/callback] ❌ Variables d'environnement Google manquantes");
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Configuration OAuth Google manquante."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Récupérer le code d'autorisation depuis l'URL
    const code = baseUrl.searchParams.get("code");
    const error = baseUrl.searchParams.get("error");

    if (error) {
      const errorDescription = baseUrl.searchParams.get("error_description") || "";
      console.error("[auth/google/callback] ❌ Erreur OAuth:", {
        error,
        errorDescription,
        redirectUri,
        origin,
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      });
      
      // Messages d'erreur plus spécifiques selon le type d'erreur
      let errorMessage = "Erreur lors de l'authentification Google. Veuillez réessayer.";
      if (error === "redirect_uri_mismatch") {
        errorMessage = "Configuration OAuth incorrecte : l'URL de redirection ne correspond pas. Veuillez contacter le support.";
      } else if (error === "access_denied") {
        errorMessage = "Accès refusé. Veuillez autoriser l'application à accéder à votre compte Google.";
      } else if (error === "invalid_client") {
        errorMessage = "Configuration OAuth incorrecte : Client ID ou Secret invalide. Veuillez contacter le support.";
      }
      
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", encodeURIComponent(errorMessage));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (!code) {
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Code d'autorisation manquant."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Vérifier l'état (CSRF protection)
    const state = request.cookies.get("google_oauth_state")?.value;
    if (!state) {
      console.error("[auth/google/callback] ❌ État OAuth manquant");
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", encodeURIComponent("Session expirée. Veuillez réessayer."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Créer le client OAuth
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Échanger le code contre un token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error("Token ID manquant dans la réponse Google");
    }

    // Vérifier et décoder le token ID
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Impossible de décoder le token Google");
    }

    const googleEmail = payload.email;
    const googleName = payload.name || null;
    const googlePicture = payload.picture || null;
    const googleSub = payload.sub; // ID unique Google

    if (!googleEmail) {
      throw new Error("Email manquant dans la réponse Google");
    }

    // S'assurer que la connexion Prisma est établie
    await ensurePrismaConnection(3);

    // Chercher ou créer l'utilisateur
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: googleEmail },
          { providerId: googleSub, authProvider: "google" },
        ],
      },
    });

    if (user) {
      // Utilisateur existant - mettre à jour les informations OAuth si nécessaire
      if (user.authProvider !== "google" || user.providerId !== googleSub) {
        // Lier le compte Google à un compte existant (même email)
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: "google",
            providerId: googleSub,
            name: googleName || user.name,
            avatarUrl: googlePicture || user.avatarUrl,
          },
        });
      } else {
        // Mettre à jour le nom et l'avatar si nécessaire
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleName || user.name,
            avatarUrl: googlePicture || user.avatarUrl,
          },
        });
      }
    } else {
      // Nouvel utilisateur - créer le compte
      user = await prisma.user.create({
        data: {
          email: googleEmail,
          name: googleName,
          avatarUrl: googlePicture,
          authProvider: "google",
          providerId: googleSub,
          passwordHash: null, // Pas de mot de passe pour OAuth
        },
      });
    }

    // Créer le token de session
    const token = await signSessionToken(user.id);

    // Créer la réponse avec le cookie de session
    const response = NextResponse.redirect(new URL("/app", origin), { status: 303 });
    setSessionCookie(response, token);

    // Supprimer le cookie d'état OAuth
    response.cookies.delete("google_oauth_state");

    console.log(`[auth/google/callback] ✅ Connexion Google réussie pour ${user.email}`);

    return response;
  } catch (error: any) {
    console.error("[auth/google/callback] ❌ Erreur:", {
      error: error?.message,
      stack: error?.stack?.substring(0, 500),
    });

    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", encodeURIComponent("Erreur lors de l'authentification Google. Veuillez réessayer."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

