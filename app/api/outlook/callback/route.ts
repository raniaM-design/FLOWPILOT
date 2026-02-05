import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "@/lib/flowpilot-auth/jwt";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/outlook/encryption";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Log de debug complet (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-callback] URL complète:", request.url);
      console.log("[outlook-callback] Query params:", Object.fromEntries(request.nextUrl.searchParams));
    }

    // Lire les paramètres depuis l'URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    // Le state est automatiquement décodé par searchParams.get()
    // Mais on garde aussi la version brute pour diagnostic
    const stateRaw = request.nextUrl.searchParams.get("state");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Log de debug (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-callback] params:", {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!error,
        codeLength: code?.length || 0,
        stateLength: state?.length || 0,
        error,
        errorDescription,
      });
    }

    // Gérer les erreurs OAuth de Microsoft
    if (error) {
      console.error("[outlook-callback] OAuth error from Microsoft:", { error, errorDescription });
      return NextResponse.json(
        { 
          error, 
          details: errorDescription || "OAuth error from Microsoft",
          source: "microsoft"
        },
        { status: 400 }
      );
    }

    // Vérifier la présence du code
    if (!code) {
      const got = { code: null, state: state || null };
      console.error("[outlook-callback] Missing code parameter", got);
      return NextResponse.json(
        { 
          error: "missing_code", 
          details: "Missing 'code' parameter in callback URL",
          got,
          hint: "The callback should only be called by Microsoft after user login"
        },
        { status: 400 }
      );
    }

    // Vérifier la présence du state
    if (!state) {
      const got = { code: code.substring(0, 20) + "...", state: null };
      console.error("[outlook-callback] Missing state parameter", got);
      return NextResponse.json(
        { 
          error: "missing_state", 
          details: "Missing 'state' parameter in callback URL",
          got,
          hint: "The state should be returned by Microsoft from the authorize request"
        },
        { status: 400 }
      );
    }

    // Lire le state depuis le cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get("outlook_oauth_state")?.value;
    
    // Vérifier aussi les headers de la requête pour diagnostiquer les problèmes de cookie
    const cookieHeader = request.headers.get("cookie");
    const hasCookieHeader = !!cookieHeader;
    const cookieHeaderContainsState = cookieHeader?.includes("outlook_oauth_state") || false;

    // Log pour diagnostic (toujours actif en production pour déboguer)
    console.log("[outlook-callback] state validation:", {
      hasStoredState: !!storedState,
      storedStateLength: storedState?.length || 0,
      receivedStateLength: state.length,
      receivedStateRawLength: stateRaw?.length || 0,
      statesMatch: storedState === state,
      // Ne pas logger le contenu complet pour sécurité
      storedStatePreview: storedState ? storedState.substring(0, 50) + "..." : null,
      receivedStatePreview: state.substring(0, 50) + "...",
      receivedStateRawPreview: stateRaw ? stateRaw.substring(0, 50) + "..." : null,
      // Log des cookies disponibles pour diagnostic
      allCookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 })),
      // Diagnostic des headers
      hasCookieHeader,
      cookieHeaderContainsState,
      cookieHeaderLength: cookieHeader?.length || 0,
      // Environnement
      isVercel: process.env.VERCEL === "1",
      nodeEnv: process.env.NODE_ENV,
      // URL de callback pour vérifier le domaine
      callbackHost: request.nextUrl.host,
      callbackProtocol: request.nextUrl.protocol,
    });

    // Vérifier que le state correspond au cookie (CSRF protection)
    if (!storedState) {
      console.error("[outlook-callback] No state cookie found");
      return NextResponse.json(
        { 
          error: "missing_state_cookie", 
          details: "State cookie not found. The OAuth flow must start with /api/outlook/connect",
          hint: "Do not call /api/outlook/callback directly. Start with /api/outlook/connect"
        },
        { status: 400 }
      );
    }

    // Comparer les states (gérer les cas d'encodage)
    // Le state peut être encodé dans l'URL, donc on compare aussi après décodage
    const stateDecoded = state ? decodeURIComponent(state) : null;
    const statesMatch = storedState === state || storedState === stateDecoded;
    
    if (!statesMatch) {
      // Log détaillé pour diagnostic
      console.error("[outlook-callback] State mismatch - détails complets:", {
        storedStateLength: storedState.length,
        receivedStateLength: state.length,
        receivedStateDecodedLength: stateDecoded?.length || 0,
        storedStatePreview: storedState.substring(0, 50) + "...",
        receivedStatePreview: state.substring(0, 50) + "...",
        receivedStateDecodedPreview: stateDecoded ? stateDecoded.substring(0, 50) + "..." : null,
        // Comparaison caractère par caractère pour identifier les différences
        firstCharMatch: storedState[0] === state[0],
        lastCharMatch: storedState[storedState.length - 1] === state[state.length - 1],
        // Vérifier si c'est un problème d'encodage
        storedStateHasColon: storedState.includes(":"),
        receivedStateHasColon: state.includes(":"),
        // URL complète pour voir le state tel qu'il apparaît dans l'URL
        callbackUrl: request.url.substring(0, 200) + "...",
      });
      
      return NextResponse.json(
        { 
          error: "invalid_state", 
          details: "CSRF state mismatch. The state from Microsoft does not match the stored cookie.",
          hint: "This could indicate a CSRF attack, expired session, or encoding issue. Check Vercel logs for detailed comparison.",
          diagnostic: {
            storedStateLength: storedState.length,
            receivedStateLength: state.length,
            previewsMatch: storedState.substring(0, 20) === state.substring(0, 20),
          }
        },
        { status: 400 }
      );
    }

    // Extraire et vérifier le state token (format: stateId:token)
    const [stateId, stateToken] = storedState.split(":");
    if (!stateId || !stateToken) {
      console.error("[outlook-callback] Invalid state format");
      return NextResponse.json(
        { error: "invalid_state_format", details: "State format is invalid" },
        { status: 400 }
      );
    }

    // Vérifier et décoder le state token JWT
    let decodedState;
    try {
      decodedState = await verify(stateToken);
    } catch (err: any) {
      console.error("[outlook-callback] State token verification failed:", err.message);
      return NextResponse.json(
        { 
          error: "invalid_state_token", 
          details: "Invalid or expired state token",
          hint: "The OAuth flow may have expired. Try starting again with /api/outlook/connect"
        },
        { status: 400 }
      );
    }

    // Extraire userId du state décodé
    const userId = decodedState.userId as string;
    if (!userId) {
      console.error("[outlook-callback] No userId in decoded state");
      return NextResponse.json(
        { error: "invalid_user", details: "User ID not found in state token" },
        { status: 400 }
      );
    }

    // Log de succès (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-callback] State validated successfully:", {
        userId,
        stateId,
      });
    }

    // Échanger le code contre des tokens
    // Lire les variables d'environnement DANS le handler (pas au top-level)
    // IMPORTANT: Utiliser le même tenant que dans /connect ("common" pour comptes pro + personnels)
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    
    // Déterminer l'URL de redirection : utiliser la variable d'env ou détecter automatiquement
    // IMPORTANT: Cette URL doit correspondre EXACTEMENT à celle utilisée dans /connect
    let redirectUriRaw = process.env.MICROSOFT_REDIRECT_URI;
    if (!redirectUriRaw) {
      // Détection automatique de l'URL de production
      const vercelUrl = process.env.VERCEL_URL;
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
      
      if (vercelUrl) {
        // Vercel fournit VERCEL_URL (sans https://)
        // VERCEL_URL peut être le domaine preview ou production
        redirectUriRaw = `https://${vercelUrl}/api/outlook/callback`;
        console.log("[outlook-callback] Using VERCEL_URL for redirect URI:", redirectUriRaw);
      } else if (appUrl) {
        // Utiliser APP_URL si défini (priorité sur NEXT_PUBLIC_APP_URL)
        redirectUriRaw = `${appUrl.replace(/\/$/, "")}/api/outlook/callback`;
        console.log("[outlook-callback] Using APP_URL for redirect URI:", redirectUriRaw);
      } else if (process.env.NODE_ENV === "production") {
        // En production sans URL détectée, loguer une erreur
        console.error("[outlook-callback] ERROR: MICROSOFT_REDIRECT_URI not set in production");
        console.error("[outlook-callback] Available env vars:", {
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
        console.log("[outlook-callback] Using default localhost redirect URI");
      }
    }
    
    // Nettoyer redirect_uri : retirer trailing slash et espaces
    const redirectUri = redirectUriRaw.trim().replace(/\/$/, "");
    
    // Nettoyer scopes : retirer les guillemets si présents et normaliser
    // Scopes requis pour supporter comptes pro + comptes Microsoft personnels
    const defaultScopes = "openid profile offline_access User.Read Calendars.Read email";
    const scopesRaw = process.env.MICROSOFT_SCOPES || defaultScopes;
    // Nettoyer les scopes : retirer guillemets, espaces multiples, sauts de ligne
    const scopes = scopesRaw
      .trim()
      .replace(/^["']|["']$/g, "") // Retirer guillemets au début/fin
      .replace(/\s+/g, " ") // Remplacer espaces multiples par un seul espace
      .replace(/[\r\n]+/g, " ") // Remplacer sauts de ligne par espaces
      .trim();

    // Log du tenant utilisé (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook] tenant:", tenantId);
    }

    // Log de debug (dev + prod pour diagnostic)
    console.log("[outlook-callback] Configuration:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasTenantId: !!process.env.MICROSOFT_TENANT_ID,
      hasRedirectUriEnv: !!process.env.MICROSOFT_REDIRECT_URI,
      hasScopes: !!process.env.MICROSOFT_SCOPES,
      redirectUri: redirectUri.substring(0, 50) + "...", // Masquer l'URL complète pour sécurité
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL || "not set",
      appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "not set",
    });

    // Vérifier les variables requises et lister celles manquantes
    const missing: string[] = [];
    if (!clientId) missing.push("MICROSOFT_CLIENT_ID");
    if (!clientSecret) missing.push("MICROSOFT_CLIENT_SECRET");

    if (missing.length > 0) {
      return NextResponse.json(
        { 
          error: "config_missing",
          missing,
          details: `Microsoft OAuth configuration missing: ${missing.join(", ")}`
        },
        { status: 500 }
      );
    }

    // À ce stade, clientId et clientSecret sont garantis d'être définis (vérifiés ci-dessus)
    // Token endpoint Microsoft OAuth v2.0
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    // Paramètres pour l'échange code -> token (x-www-form-urlencoded)
    const params = new URLSearchParams();
    params.append("client_id", clientId!);
    params.append("client_secret", clientSecret!);
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", redirectUri); // Doit correspondre exactement à authorize
    params.append("scope", scopes); // String avec espaces entre scopes

    // Log temporaire pour debug (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-oauth] token exchange:", {
        endpoint: tokenEndpoint,
        redirect_uri: redirectUri,
        scope: scopes,
        hasCode: !!code,
      });
    }

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Erreur lors de l'échange du token:", errorText);
      return NextResponse.json(
        { error: "token_exchange_failed", details: errorText },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Récupérer le providerAccountId depuis l'ID token (JWT) si disponible
    // Sinon, on le récupérera lors du premier appel Graph API
    let providerAccountId: string | null = null;
    
    if (tokenData.id_token) {
      try {
        // Décoder le JWT ID token (format: header.payload.signature)
        const parts = tokenData.id_token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          // L'ID peut être dans "oid" (objectId Azure AD) ou "sub" (subject)
          providerAccountId = payload.oid || payload.sub || null;
        }
      } catch (error) {
        // Si le décodage échoue, on continue sans providerAccountId
        // Il sera récupéré lors du premier appel Graph API
        if (process.env.NODE_ENV === "development") {
          console.log("[outlook-callback] Could not decode ID token, will fetch providerAccountId later");
        }
      }
    }

    // Récupérer l'email et providerAccountId via Graph API
    let outlookEmail: string | null = null;
    if (tokenData.access_token) {
      try {
        const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (meResponse.ok) {
          const meData = await meResponse.json();
          providerAccountId = meData.id || providerAccountId;
          // Récupérer l'email (mail ou userPrincipalName)
          outlookEmail = meData.mail || meData.userPrincipalName || null;
        }
      } catch (error) {
        // Si l'appel Graph échoue, on continue sans email/providerAccountId
        // Ils seront récupérés lors d'un prochain appel
        if (process.env.NODE_ENV === "development") {
          console.log("[outlook-callback] Could not fetch user info from Graph API, will fetch later");
        }
      }
    }

    // Chiffrer les tokens avant stockage
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = encryptToken(tokenData.refresh_token);

    // Log minimaliste (sans tokens)
    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook-callback] Storing tokens for user ${userId}`, {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresAt: expiresAt.toISOString(),
        hasProviderAccountId: !!providerAccountId,
      });
    }

    // Vérifier si une connexion existe déjà
    const existingAccount = await prisma.outlookAccount.findUnique({
      where: { userId },
    });

    // Stocker ou mettre à jour le compte Outlook avec tokens chiffrés
    // Si une connexion existe déjà, elle est remplacée (un seul compte par utilisateur)
    await prisma.outlookAccount.upsert({
      where: { userId },
      create: {
        userId,
        provider: "outlook",
        email: outlookEmail,
        providerAccountId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scope: scopes,
        tokenType: tokenData.token_type || "Bearer",
        connectedAt: new Date(), // Nouvelle connexion
      },
      update: {
        email: outlookEmail || undefined, // Mettre à jour l'email si disponible
        providerAccountId: providerAccountId || undefined,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scope: scopes,
        tokenType: tokenData.token_type || "Bearer",
        connectedAt: existingAccount ? existingAccount.connectedAt : new Date(), // Conserver la date originale ou mettre à jour
      },
    });

    // Supprimer le cookie de state après succès
    cookieStore.delete("outlook_oauth_state");

    // Log de succès (dev uniquement)
    if (process.env.NODE_ENV === "development") {
      console.log("[outlook-callback] OAuth flow completed successfully:", {
        userId,
        meetingId: tokenData.access_token ? "token received" : "no token",
      });
    }

    return NextResponse.redirect(
      new URL("/app/integrations/outlook?connected=1", request.url)
    );
  } catch (error: any) {
    console.error("Erreur dans le callback Outlook:", error);
    return NextResponse.json(
      { error: "callback_error", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

