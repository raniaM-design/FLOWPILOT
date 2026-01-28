import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { getValidMicrosoftAccessToken } from "@/lib/outlook/graph";
import { prisma } from "@/lib/db";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Interface pour un événement Microsoft Graph calendarView
 */
interface GraphCalendarViewEvent {
  id: string;
  iCalUId?: string;
  subject?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay?: boolean;
  organizer?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: string;
  }>;
  onlineMeeting?: {
    joinUrl?: string;
  };
  location?: {
    displayName?: string;
  };
  lastModifiedDateTime?: string;
  isCancelled?: boolean;
  webLink?: string;
}

/**
 * Normalise une date/heure depuis Microsoft Graph vers UTC
 */
function normalizeDateTime(dateTime: string, timeZone: string, isAllDay: boolean): Date {
  if (isAllDay) {
    // Pour les événements all-day, utiliser la date seule (midnight UTC)
    return new Date(dateTime.split("T")[0] + "T00:00:00Z");
  }
  
  // Pour les événements avec heure, Microsoft Graph retourne déjà en UTC si on utilise Prefer header
  // Sinon, on parse directement (le format ISO contient déjà le timezone)
  return new Date(dateTime);
}

/**
 * Normalise les participants depuis Microsoft Graph
 */
function normalizeParticipants(
  attendees?: Array<{ emailAddress: { address: string; name?: string }; type: string }>,
  organizer?: { emailAddress: { address: string; name?: string } }
): string {
  const emails: string[] = [];
  
  // Ajouter l'organisateur en premier
  if (organizer?.emailAddress?.address) {
    emails.push(organizer.emailAddress.address);
  }
  
  // Ajouter les participants (exclure l'organisateur si déjà présent)
  if (attendees) {
    for (const attendee of attendees) {
      const email = attendee.emailAddress?.address;
      if (email && !emails.includes(email)) {
        emails.push(email);
      }
    }
  }
  
  return emails.join(", ");
}

/**
 * Normalise le contexte (organisateur + location + onlineMeeting)
 */
function normalizeContext(
  organizer?: { emailAddress: { address: string; name?: string } },
  location?: { displayName?: string },
  onlineMeeting?: { joinUrl?: string }
): string | null {
  const parts: string[] = [];
  
  if (organizer?.emailAddress?.address) {
    parts.push(`Organisateur: ${organizer.emailAddress.address}`);
  }
  
  if (location?.displayName) {
    parts.push(`Lieu: ${location.displayName}`);
  }
  
  if (onlineMeeting?.joinUrl) {
    parts.push(`Lien: ${onlineMeeting.joinUrl}`);
  }
  
  return parts.length > 0 ? parts.join(" | ") : null;
}

/**
 * Récupère tous les événements avec pagination
 */
async function fetchAllCalendarViewEvents(
  accessToken: string,
  startDateTime: string,
  endDateTime: string
): Promise<GraphCalendarViewEvent[]> {
  const allEvents: GraphCalendarViewEvent[] = [];
  let nextLink: string | null = null;
  
  // Construire l'URL initiale
  const baseUrl = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$top=50&$orderby=start/dateTime&$select=id,iCalUId,subject,start,end,isAllDay,organizer,attendees,onlineMeeting,location,lastModifiedDateTime,isCancelled,webLink`;
  
  do {
    const url: string = nextLink || baseUrl;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: 'outlook.timezone="UTC"', // Normaliser en UTC
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft Graph API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    const events = data.value || [];
    allEvents.push(...events);
    
    // Vérifier s'il y a une page suivante
    nextLink = data["@odata.nextLink"] || null;
    
    if (process.env.NODE_ENV === "development" && nextLink) {
      console.log(`[outlook-sync] Fetched ${events.length} events, more pages available`);
    }
  } while (nextLink);
  
  return allEvents;
}

/**
 * Endpoint POST /api/integrations/outlook/sync
 * Synchronise les événements Outlook vers PILOTYS
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Vous devez être connecté pour synchroniser Outlook" },
        { status: 401 }
      );
    }

    // Récupérer le paramètre range (optionnel, default = "default")
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "default";

    // Calculer les dates selon le range
    const now = new Date();
    let startDateTime: Date;
    let endDateTime: Date;

    if (range === "default") {
      // now-30j à now+90j
      startDateTime = new Date(now);
      startDateTime.setDate(now.getDate() - 30);
      endDateTime = new Date(now);
      endDateTime.setDate(now.getDate() + 90);
    } else {
      // Format personnalisé: "YYYY-MM-DD,YYYY-MM-DD"
      const parts = range.split(",");
      if (parts.length !== 2) {
        return NextResponse.json(
          { error: "InvalidRange", message: "Format de range invalide. Utilisez 'default' ou 'YYYY-MM-DD,YYYY-MM-DD'" },
          { status: 400 }
        );
      }
      startDateTime = new Date(parts[0] + "T00:00:00Z");
      endDateTime = new Date(parts[1] + "T23:59:59Z");
    }

    // Récupérer un access token valide
    let accessToken: string;
    try {
      accessToken = await getValidMicrosoftAccessToken(userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      if (errorMessage.includes("not found") || errorMessage.includes("missing")) {
        return NextResponse.json(
          { 
            error: "NotConnected", 
            message: "Aucun compte Outlook connecté",
            hint: "Connectez votre compte Outlook d'abord"
          },
          { status: 404 }
        );
      }

      console.error(`[outlook-sync] Failed to get access token for user ${userId}:`, errorMessage);
      return NextResponse.json(
        { 
          error: "TokenError", 
          message: "Impossible d'obtenir un token d'accès valide",
          details: errorMessage
        },
        { status: 500 }
      );
    }

    // Récupérer tous les événements avec pagination
    const startISO = startDateTime.toISOString();
    const endISO = endDateTime.toISOString();

    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook-sync] Starting sync for user ${userId} from ${startISO} to ${endISO}`);
    }

    let graphEvents: GraphCalendarViewEvent[];
    try {
      graphEvents = await fetchAllCalendarViewEvents(accessToken, startISO, endISO);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[outlook-sync] Failed to fetch events from Microsoft Graph:`, errorMessage);
      return NextResponse.json(
        { 
          error: "GraphAPIError", 
          message: "Erreur lors de la récupération des événements depuis Microsoft Graph",
          details: errorMessage
        },
        { status: 502 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook-sync] Fetched ${graphEvents.length} events from Microsoft Graph`);
    }

    // Statistiques
    let nbImported = 0;
    let nbUpdated = 0;
    let nbSkipped = 0;
    let nbCancelled = 0;
    const errors: Array<{ eventId: string; error: string }> = [];

    // Traiter chaque événement
    for (const graphEvent of graphEvents) {
      try {
        // Ignorer les événements annulés (mais les compter)
        if (graphEvent.isCancelled) {
          nbCancelled++;
          
          // Marquer comme annulé dans la DB si l'événement existe
          await prisma.meeting.updateMany({
            where: {
              ownerId: userId,
              externalEventId: graphEvent.id,
            },
            data: {
              externalIsCancelled: true,
            },
          });
          
          continue;
        }

        // Normaliser les données
        const isAllDay = graphEvent.isAllDay || false;
        const startDate = normalizeDateTime(graphEvent.start.dateTime, graphEvent.start.timeZone, isAllDay);
        const endDate = normalizeDateTime(graphEvent.end.dateTime, graphEvent.end.timeZone, isAllDay);
        const participants = normalizeParticipants(graphEvent.attendees, graphEvent.organizer);
        const context = normalizeContext(graphEvent.organizer, graphEvent.location, graphEvent.onlineMeeting);
        const subject = graphEvent.subject || "Sans titre";
        const iCalUId = graphEvent.iCalUId || null;
        const lastModifiedDateTime = graphEvent.lastModifiedDateTime ? new Date(graphEvent.lastModifiedDateTime) : null;

        // Vérifier si l'événement existe déjà
        const existingMeeting = await prisma.meeting.findUnique({
          where: {
            ownerId_externalEventId: {
              ownerId: userId,
              externalEventId: graphEvent.id,
            },
          },
        });

        if (existingMeeting) {
          // Vérifier si l'événement a été modifié
          if (lastModifiedDateTime && existingMeeting.externalLastModified) {
            const existingLastModified = new Date(existingMeeting.externalLastModified);
            if (lastModifiedDateTime <= existingLastModified) {
              // Pas de modification, skip
              nbSkipped++;
              continue;
            }
          }

          // Mettre à jour l'événement existant
          await prisma.meeting.update({
            where: {
              id: existingMeeting.id,
            },
            data: {
              title: subject,
              date: startDate,
              participants: participants || null,
              context,
              externalICalUId: iCalUId,
              externalLastModified: lastModifiedDateTime,
              externalIsCancelled: false,
              externalStartDateTime: startDate,
              externalEndDateTime: endDate,
              isSynced: true,
            },
          });

          nbUpdated++;
        } else {
          // Créer un nouveau meeting
          await prisma.meeting.create({
            data: {
              ownerId: userId,
              title: subject,
              date: startDate,
              participants: participants || null,
              context,
              raw_notes: "", // Vide par défaut
              externalProvider: "outlook",
              externalEventId: graphEvent.id,
              externalICalUId: iCalUId,
              externalLastModified: lastModifiedDateTime,
              externalIsCancelled: false,
              externalStartDateTime: startDate,
              externalEndDateTime: endDate,
              isSynced: true,
            },
          });

          nbImported++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        errors.push({
          eventId: graphEvent.id,
          error: errorMessage,
        });
        console.error(`[outlook-sync] Error processing event ${graphEvent.id}:`, errorMessage);
      }
    }

    // Réponse de succès avec statistiques
    return NextResponse.json({
      success: true,
      range: {
        start: startISO,
        end: endISO,
      },
      statistics: {
        totalFetched: graphEvents.length,
        nbImported,
        nbUpdated,
        nbSkipped,
        nbCancelled,
        nbErrors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Erreur inattendue côté serveur
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[outlook-sync] Unexpected server error:", errorMessage, error);
    
    return NextResponse.json(
      { 
        error: "InternalServerError", 
        message: "Une erreur interne s'est produite lors de la synchronisation Outlook",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

