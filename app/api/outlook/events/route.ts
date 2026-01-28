import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { fetchOutlookEvents } from "@/lib/outlook/graph";
import { prisma } from "@/lib/db";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD

    if (!from || !to) {
      return NextResponse.json(
        { error: "Paramètres 'from' et 'to' requis (format YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Convertir en ISO avec timezone
    const fromISO = new Date(from + "T00:00:00").toISOString();
    const toISO = new Date(to + "T23:59:59").toISOString();

    const events = await fetchOutlookEvents(userId, fromISO, toISO);

    // Récupérer les événements déjà importés pour cet utilisateur
    const importedMeetings = await prisma.meeting.findMany({
      where: {
        ownerId: userId,
        externalProvider: "outlook",
        externalEventId: {
          not: null,
        },
      },
      select: {
        externalEventId: true,
        id: true, // Inclure l'ID du meeting pour le lien
      },
    });

    const importedEventIds = new Set(
      importedMeetings
        .map((m) => m.externalEventId)
        .filter((id): id is string => id !== null && id !== undefined)
    );
    
    // Créer un map eventId -> meetingId pour les liens
    const eventIdToMeetingId = new Map<string, string>();
    importedMeetings.forEach((m) => {
      if (m.externalEventId) {
        eventIdToMeetingId.set(m.externalEventId, m.id);
      }
    });

    // Marquer les événements déjà importés avec leur meetingId
    const eventsWithImportStatus = events.map((event) => ({
      ...event,
      isImported: importedEventIds.has(event.id),
      meetingId: eventIdToMeetingId.get(event.id) || null,
    }));

    return NextResponse.json({ events: eventsWithImportStatus });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des événements Outlook:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}

