import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { fetchOutlookEventById } from "@/lib/outlook/graph";
import { prisma } from "@/lib/db";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Paramètre 'eventId' requis" },
        { status: 400 }
      );
    }

    // Récupérer l'événement Outlook
    const outlookEvent = await fetchOutlookEventById(userId, eventId);

    // Vérifier si le meeting existe déjà
    const existingMeeting = await prisma.meeting.findUnique({
      where: {
        ownerId_externalEventId: {
          ownerId: userId,
          externalEventId: eventId,
        },
      },
    });

    if (existingMeeting) {
      return NextResponse.json({
        ok: true,
        alreadyImported: true,
        meetingId: existingMeeting.id,
      });
    }

    // Préparer les données pour le meeting
    const startDate = new Date(outlookEvent.start.dateTime);
    const participants = outlookEvent.attendees
      ?.map((a) => a.emailAddress.address)
      .join(", ") || "";

    let context = "";
    if (outlookEvent.organizer) {
      context = `Organisateur: ${outlookEvent.organizer.emailAddress.address}`;
    }
    if (outlookEvent.onlineMeetingUrl) {
      context += context ? ` | Lien: ${outlookEvent.onlineMeetingUrl}` : `Lien: ${outlookEvent.onlineMeetingUrl}`;
    }

    const rawNotes = outlookEvent.bodyPreview || "";

    // Créer le meeting
    const meeting = await prisma.meeting.create({
      data: {
        ownerId: userId,
        title: outlookEvent.subject,
        date: startDate,
        participants,
        context: context || null,
        raw_notes: rawNotes,
        externalProvider: "outlook",
        externalEventId: eventId,
        isSynced: true,
      },
    });

    return NextResponse.json({
      ok: true,
      alreadyImported: false,
      meetingId: meeting.id,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'import de l'événement Outlook:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'import" },
      { status: 500 }
    );
  }
}

