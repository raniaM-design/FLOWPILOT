import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { getValidMicrosoftAccessToken } from "@/lib/outlook/graph";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de test pour l'intégration Outlook
 * Vérifie que l'authentification et les appels Graph API fonctionnent correctement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification de l'utilisateur
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Vous devez être connecté pour tester l'intégration Outlook" },
        { status: 401 }
      );
    }

    // Récupérer un access token valide (avec refresh automatique si nécessaire)
    let accessToken: string;
    try {
      accessToken = await getValidMicrosoftAccessToken(userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      // Vérifier si c'est un compte non connecté
      if (errorMessage.includes("not found") || errorMessage.includes("missing")) {
        return NextResponse.json(
          { 
            error: "NotConnected", 
            message: "Aucun compte Outlook connecté. Veuillez d'abord connecter votre compte Outlook.",
            hint: "Allez sur /app/integrations/outlook pour connecter votre compte"
          },
          { status: 404 }
        );
      }

      // Autres erreurs de token
      console.error(`[outlook-test] Failed to get access token for user ${userId}:`, errorMessage);
      return NextResponse.json(
        { 
          error: "TokenError", 
          message: "Impossible d'obtenir un token d'accès valide",
          details: errorMessage
        },
        { status: 500 }
      );
    }

    // Appel 1: Récupérer les informations de l'utilisateur Microsoft
    const meResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Gérer les erreurs HTTP de Microsoft Graph
    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Erreurs d'authentification/autorisation
      if (meResponse.status === 401) {
        return NextResponse.json(
          { 
            error: "Unauthorized", 
            message: "Token d'accès invalide ou expiré",
            details: errorData.error?.message || "Microsoft Graph a rejeté le token",
            hint: "Essayez de vous reconnecter à Outlook"
          },
          { status: 401 }
        );
      }

      if (meResponse.status === 403) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: "Permissions insuffisantes pour accéder à votre profil Microsoft",
            details: errorData.error?.message || "Le token n'a pas les permissions nécessaires",
            hint: "Vérifiez que les scopes 'User.Read' sont accordés"
          },
          { status: 403 }
        );
      }

      // Rate limiting
      if (meResponse.status === 429) {
        const retryAfter = meResponse.headers.get("Retry-After");
        return NextResponse.json(
          { 
            error: "RateLimited", 
            message: "Trop de requêtes vers Microsoft Graph. Veuillez réessayer plus tard.",
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : null,
            hint: `Attendez ${retryAfter || 60} secondes avant de réessayer`
          },
          { status: 429 }
        );
      }

      // Erreurs serveur Microsoft
      if (meResponse.status >= 500) {
        console.error(`[outlook-test] Microsoft Graph error for user ${userId}:`, meResponse.status, errorText);
        return NextResponse.json(
          { 
            error: "MicrosoftGraphError", 
            message: "Erreur serveur Microsoft Graph",
            status: meResponse.status,
            details: errorData.error?.message || "Service temporairement indisponible",
            hint: "Réessayez dans quelques instants"
          },
          { status: 502 } // Bad Gateway (on proxifie l'erreur)
        );
      }

      // Autres erreurs
      console.error(`[outlook-test] Unexpected error from Microsoft Graph for user ${userId}:`, meResponse.status, errorText);
      return NextResponse.json(
        { 
          error: "GraphAPIError", 
          message: "Erreur lors de l'appel à Microsoft Graph",
          status: meResponse.status,
          details: errorData.error?.message || errorText
        },
        { status: 502 }
      );
    }

    const meData = await meResponse.json();
    const displayName = meData.displayName || meData.userPrincipalName || meData.mail || "Utilisateur inconnu";

    // Appel 2: Récupérer les événements du calendrier
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const eventsUrl = `https://graph.microsoft.com/v1.0/me/calendar/events?$top=5&$filter=start/dateTime ge '${today.toISOString()}' and start/dateTime le '${nextWeek.toISOString()}'&$orderby=start/dateTime&$select=id,subject,start,end`;

    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Gérer les erreurs HTTP pour les événements
    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Erreurs d'authentification/autorisation
      if (eventsResponse.status === 401) {
        return NextResponse.json(
          { 
            error: "Unauthorized", 
            message: "Token d'accès invalide ou expiré lors de la récupération des événements",
            details: errorData.error?.message || "Microsoft Graph a rejeté le token",
            hint: "Essayez de vous reconnecter à Outlook"
          },
          { status: 401 }
        );
      }

      if (eventsResponse.status === 403) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: "Permissions insuffisantes pour accéder à votre calendrier",
            details: errorData.error?.message || "Le token n'a pas les permissions 'Calendars.Read'",
            hint: "Vérifiez que les scopes 'Calendars.Read' sont accordés"
          },
          { status: 403 }
        );
      }

      // Rate limiting
      if (eventsResponse.status === 429) {
        const retryAfter = eventsResponse.headers.get("Retry-After");
        return NextResponse.json(
          { 
            error: "RateLimited", 
            message: "Trop de requêtes vers Microsoft Graph. Veuillez réessayer plus tard.",
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : null,
            hint: `Attendez ${retryAfter || 60} secondes avant de réessayer`
          },
          { status: 429 }
        );
      }

      // Erreurs serveur Microsoft
      if (eventsResponse.status >= 500) {
        console.error(`[outlook-test] Microsoft Graph events error for user ${userId}:`, eventsResponse.status, errorText);
        return NextResponse.json(
          { 
            error: "MicrosoftGraphError", 
            message: "Erreur serveur Microsoft Graph lors de la récupération des événements",
            status: eventsResponse.status,
            details: errorData.error?.message || "Service temporairement indisponible",
            hint: "Réessayez dans quelques instants"
          },
          { status: 502 }
        );
      }

      // Autres erreurs
      console.error(`[outlook-test] Unexpected error from Microsoft Graph events for user ${userId}:`, eventsResponse.status, errorText);
      return NextResponse.json(
        { 
          error: "GraphAPIError", 
          message: "Erreur lors de la récupération des événements depuis Microsoft Graph",
          status: eventsResponse.status,
          details: errorData.error?.message || errorText
        },
        { status: 502 }
      );
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.value || [];
    const eventsCount = events.length;

    // Préparer l'échantillon d'événements
    const eventsSample = events.slice(0, 5).map((event: any) => ({
      id: event.id,
      subject: event.subject || "Sans titre",
      start: event.start?.dateTime || null,
      end: event.end?.dateTime || null,
    }));

    // Réponse de succès
    return NextResponse.json({
      success: true,
      user: {
        displayName,
        id: meData.id || null,
        email: meData.mail || meData.userPrincipalName || null,
      },
      events: {
        count: eventsCount,
        sample: eventsSample,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Erreur inattendue côté serveur
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[outlook-test] Unexpected server error:", errorMessage, error);
    
    return NextResponse.json(
      { 
        error: "InternalServerError", 
        message: "Une erreur interne s'est produite lors du test de l'intégration Outlook",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

