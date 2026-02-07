import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { MeetingExtractionSchema, type MeetingExtraction } from "@/lib/meetings/meeting-extraction-schema";

/**
 * API Route pour sauvegarder une extraction validée
 * POST /api/meetings/save-extraction
 * Body: { cleanedText: string, extracted: MeetingExtraction, selections: {...}, meetingData: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserIdOrThrow();

    const body = await request.json();
    const { cleanedText, extracted, selections, meetingData } = body;

    // Valider l'extraction
    const validatedExtraction = MeetingExtractionSchema.parse(extracted);

    // Créer la réunion
    const meeting = await prisma.meeting.create({
      data: {
        ownerId: userId,
        title: meetingData.title || validatedExtraction.meta.title || "Réunion sans titre",
        date: meetingData.date ? new Date(meetingData.date) : new Date(),
        participants: meetingData.participants || validatedExtraction.meta.attendees.map((a) => a.name).join(", ") || null,
        context: meetingData.context || null,
        raw_notes: cleanedText,
        analysisJson: JSON.stringify(validatedExtraction),
        analyzedAt: new Date(),
        projectId: meetingData.projectId || null,
      },
    });

    // Créer les décisions sélectionnées
    if (selections.decisions && Array.isArray(selections.decisions)) {
      const selectedDecisions = validatedExtraction.decisions.filter((d) =>
        selections.decisions.includes(d.id)
      );

      for (const decision of selectedDecisions) {
        // Trouver ou créer un projet par défaut
        let projectId = meeting.projectId;
        if (!projectId) {
          const defaultProject = await prisma.project.findFirst({
            where: { ownerId: userId, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
          });
          projectId = defaultProject?.id || null;
        }

        if (projectId) {
          await prisma.decision.create({
            data: {
              projectId,
              createdById: userId,
              title: decision.text.substring(0, 200),
              context: decision.evidence || null,
              decision: decision.text,
              status: "DRAFT",
            },
          });
        }
      }
    }

    // Créer les actions sélectionnées
    if (selections.actions && Array.isArray(selections.actions)) {
      const selectedActions = validatedExtraction.actions.filter((a) =>
        selections.actions.includes(a.id)
      );

      // Trouver ou créer un projet par défaut
      let projectId = meeting.projectId;
      if (!projectId) {
        const defaultProject = await prisma.project.findFirst({
          where: { ownerId: userId, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        });
        projectId = defaultProject?.id || null;
      }

      if (projectId) {
        for (const action of selectedActions) {
          // Parser la date si disponible
          let dueDate: Date | null = null;
          if (action.due_date) {
            dueDate = new Date(action.due_date);
          }

          await prisma.actionItem.create({
            data: {
              projectId,
              meetingId: meeting.id,
              createdById: userId,
              title: action.task.substring(0, 200),
              description: action.due_date_raw || action.evidence || null,
              status: action.status === "done" ? "DONE" : action.status === "in_progress" ? "DOING" : "TODO",
              dueDate,
            },
          });
        }
      }
    }

    return NextResponse.json({ meetingId: meeting.id });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la sauvegarde: ${errorMessage}` },
      { status: 500 }
    );
  }
}

