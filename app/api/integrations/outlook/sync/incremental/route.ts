import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { getValidMicrosoftAccessToken } from "@/lib/outlook/graph";
import { prisma } from "@/lib/db";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Interface pour un événement Microsoft Graph calendarView delta
 */
interface GraphCalendarViewDeltaEvent {
  id: string;
  iCalUId?: string;
  subject?: string;
  start?: {
    dateTime: string;
    timeZone: string;
  };
  end?: {
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
    return new Date(dateTime.split("T")[0] + "T00:00:00Z");
  }
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
  
  if (organizer?.emailAddress?.address) {
    emails.push(organizer.emailAddress.address);
  }
  
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
 * Récupère les changements via delta query
 */
async function fetchDeltaChanges(
  accessToken: string,
  deltaLink: string | null,
  startDateTime: string,
  endDateTime: string
): Promise<{
  events: GraphCalendarViewDeltaEvent[];
  nextDeltaLink: string | null;
  hasMore: boolean;
}> {
  let url: string;
  
  if (deltaLink) {
    // Utiliser le deltaLink pour récupérer seulement les changements
    url = deltaLink;
  } else {
    // Première sync : utiliser /delta avec start/end
    url = `https://graph.microsoft.com/v1.0/me/calendarView/delta?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$top=50&$orderby=start/dateTime&$select=id,iCalUId,subject,start,end,isAllDay,organizer,attendees,onlineMeeting,location,lastModifiedDateTime,isCancelled,webLink`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: 'outlook.timezone="UTC"',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Graph API delta error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const events = data.value || [];
  
  // Le deltaLink est dans @odata.deltaLink (pour la prochaine sync) ou @odata.nextLink (si plus de pages)
  const nextDeltaLink = data["@odata.deltaLink"] || null;
  const nextLink = data["@odata.nextLink"] || null;
  const hasMore = !!nextLink;

  return {
    events,
    nextDeltaLink: nextDeltaLink || (hasMore ? url : null), // Conserver le deltaLink même s'il y a des pages suivantes
    hasMore,
  };
}

/**
 * Récupère toutes les pages de delta (si nécessaire)
 */
async function fetchAllDeltaChanges(
  accessToken: string,
  deltaLink: string | null,
  startDateTime: string,
  endDateTime: string
): Promise<{
  events: GraphCalendarViewDeltaEvent[];
  finalDeltaLink: string | null;
}> {
  const allEvents: GraphCalendarViewDeltaEvent[] = [];
  let currentDeltaLink = deltaLink;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchDeltaChanges(accessToken, currentDeltaLink, startDateTime, endDateTime);
    allEvents.push(...result.events);
    
    if (result.nextDeltaLink) {
      currentDeltaLink = result.nextDeltaLink;
    }
    
    hasMore = result.hasMore;
    
    if (process.env.NODE_ENV === "development" && hasMore) {
      console.log(`[outlook-sync-incremental] Fetched ${result.events.length} delta events, more pages available`);
    }
  }

  return {
    events: allEvents,
    finalDeltaLink: currentDeltaLink,
  };
}

/**
 * Endpoint POST /api/integrations/outlook/sync/incremental
 * Synchronise les événements Outlook de manière incrémentale via delta queries
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

      console.error(`[outlook-sync-incremental] Failed to get access token for user ${userId}:`, errorMessage);
      return NextResponse.json(
        { 
          error: "TokenError", 
          message: "Impossible d'obtenir un token d'accès valide",
          details: errorMessage
        },
        { status: 500 }
      );
    }

    // Récupérer ou créer l'état de synchronisation
    let syncState = await prisma.outlookSyncState.findUnique({
      where: { userId },
    });

    const startISO = startDateTime.toISOString();
    const endISO = endDateTime.toISOString();
    const deltaLink = syncState?.deltaLink || null;
    const isFirstSync = !deltaLink;

    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook-sync-incremental] Starting ${isFirstSync ? "initial" : "incremental"} sync for user ${userId}`, {
        hasDeltaLink: !!deltaLink,
        range: `${startISO} to ${endISO}`,
      });
    }

    // Récupérer les changements via delta query
    let deltaResult: { events: GraphCalendarViewDeltaEvent[]; finalDeltaLink: string | null };
    try {
      deltaResult = await fetchAllDeltaChanges(accessToken, deltaLink, startISO, endISO);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[outlook-sync-incremental] Failed to fetch delta changes:`, errorMessage);
      return NextResponse.json(
        { 
          error: "GraphAPIError", 
          message: "Erreur lors de la récupération des changements depuis Microsoft Graph",
          details: errorMessage
        },
        { status: 502 }
      );
    }

    const graphEvents = deltaResult.events;
    const finalDeltaLink = deltaResult.finalDeltaLink;

    if (process.env.NODE_ENV === "development") {
      console.log(`[outlook-sync-incremental] Fetched ${graphEvents.length} delta events from Microsoft Graph`);
    }

    // Statistiques
    let nbCreated = 0;
    let nbUpdated = 0;
    let nbDeleted = 0;
    const errors: Array<{ eventId: string; error: string }> = [];

    // Traiter chaque événement du delta
    for (const graphEvent of graphEvents) {
      try {
        // Vérifier si c'est une suppression (tombstone)
        // Microsoft Graph retourne seulement l'id pour les événements supprimés
        const isTombstone = !graphEvent.subject && !graphEvent.start && !graphEvent.end;
        const isCancelled = graphEvent.isCancelled || false;

        if (isTombstone || isCancelled) {
          // Supprimer ou marquer comme annulé dans la DB
          const existingMeeting = await prisma.meeting.findUnique({
            where: {
              ownerId_externalEventId: {
                ownerId: userId,
                externalEventId: graphEvent.id,
              },
            },
          });

          if (existingMeeting) {
            if (isTombstone) {
              // Suppression complète : supprimer le meeting
              await prisma.meeting.delete({
                where: { id: existingMeeting.id },
              });
              nbDeleted++;
            } else {
              // Annulation : marquer comme annulé
              await prisma.meeting.update({
                where: { id: existingMeeting.id },
                data: {
                  externalIsCancelled: true,
                },
              });
              nbDeleted++; // Compter les annulations comme suppressions pour le résumé
            }
          }
          continue;
        }

        // Normaliser les données pour les événements créés/modifiés
        if (!graphEvent.start || !graphEvent.end) {
          // Événement incomplet, skip
          continue;
        }

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
              externalIsCancelled: false, // Réactiver si annulé précédemment
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
              raw_notes: "",
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

          nbCreated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        errors.push({
          eventId: graphEvent.id,
          error: errorMessage,
        });
        console.error(`[outlook-sync-incremental] Error processing event ${graphEvent.id}:`, errorMessage);
      }
    }

    // Mettre à jour ou créer l'état de synchronisation avec le nouveau deltaLink
    if (finalDeltaLink) {
      await prisma.outlookSyncState.upsert({
        where: { userId },
        create: {
          userId,
          deltaLink: finalDeltaLink,
          lastSyncAt: new Date(),
          syncRangeStart: startDateTime,
          syncRangeEnd: endDateTime,
        },
        update: {
          deltaLink: finalDeltaLink,
          lastSyncAt: new Date(),
          syncRangeStart: startDateTime,
          syncRangeEnd: endDateTime,
        },
      });
    }

    // Réponse de succès avec statistiques
    return NextResponse.json({
      success: true,
      syncType: isFirstSync ? "initial" : "incremental",
      range: {
        start: startISO,
        end: endISO,
      },
      statistics: {
        totalFetched: graphEvents.length,
        created: nbCreated,
        updated: nbUpdated,
        deleted: nbDeleted,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      hasDeltaLink: !!finalDeltaLink,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Erreur inattendue côté serveur
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[outlook-sync-incremental] Unexpected server error:", errorMessage, error);
    
    return NextResponse.json(
      { 
        error: "InternalServerError", 
        message: "Une erreur interne s'est produite lors de la synchronisation incrémentale Outlook",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

