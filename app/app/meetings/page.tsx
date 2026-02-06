import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { getTranslations } from "@/i18n/request";
import { MeetingsListWithFilters } from "@/components/meetings/meetings-list-with-filters";

type Meeting = {
  id: string;
  title: string;
  date: Date;
  participants: string | null;
  context: string | null;
  raw_notes: string;
};

export default async function MeetingsPage() {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();

  // Récupérer les IDs des réunions où l'utilisateur est mentionné
  const mentionedMeetingIds = await (prisma as any).meetingMention.findMany({
    where: {
      userId,
    },
    select: {
      meetingId: true,
    },
  }).then((mentions: any[]) => mentions.map((m: any) => m.meetingId));

  // Récupérer toutes les réunions accessibles à l'utilisateur :
  // - Réunions créées par l'utilisateur
  // - OU réunions où l'utilisateur est mentionné
  const meetings = await (prisma as any).meeting.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },
        ...(mentionedMeetingIds.length > 0
          ? [
              {
                id: {
                  in: mentionedMeetingIds,
                },
              },
            ]
          : []),
      ],
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      actions: {
        include: {
          decision: {
            select: {
              id: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 50,
  });

  // Enrichir les réunions avec les métadonnées nécessaires
  type MeetingWithRelations = (typeof meetings)[0];
  const enrichedMeetings = meetings.map((meeting: MeetingWithRelations) => {
    // Utiliser le projet lié directement à la réunion, sinon chercher via les actions
    let projectName = null;
    let projectId = null;
    
    if (meeting.project) {
      // Projet directement lié à la réunion
      projectName = meeting.project.name;
      projectId = meeting.project.id;
    } else {
      // Fallback : trouver le projet via les actions
      const projectFromActions = meeting.actions.find((a) => a.project)?.project;
      if (projectFromActions) {
        projectName = projectFromActions.name;
        projectId = projectFromActions.id;
      } else if (meeting.context) {
        // Dernier fallback : utiliser le context comme texte libre
        projectName = meeting.context;
      }
    }

    // Compter les décisions uniques liées aux actions de cette réunion
    const uniqueDecisions = new Set(
      meeting.actions
        .filter((a) => a.decision)
        .map((a) => a.decision!.id)
    );
    const decisionsCount = uniqueDecisions.size;

    // Compter les notes (basé sur raw_notes)
    const notesCount = meeting.raw_notes ? Math.ceil(meeting.raw_notes.length / 100) : 0;

    return {
      id: meeting.id,
      title: meeting.title,
      date: meeting.date.toISOString(),
      participants: meeting.participants,
      context: meeting.context,
      projectId,
      projectName,
      decisionsCount,
      notesCount,
    };
  });

  return (
    <div className="space-y-8">
      {/* En-tête avec titre et bouton */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-semibold text-[#111111] leading-tight mb-3">
            {t("meetings.title")}
          </h1>
          <p className="text-base text-[#667085] leading-relaxed">
            Gérez vos réunions et transformez-les en décisions et actions
          </p>
        </div>
        <div className="flex-shrink-0">
          <Link href="/app/meetings/new">
            <Button 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-5 py-2.5 h-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle réunion
            </Button>
          </Link>
        </div>
      </div>

      {/* Liste des réunions avec filtres */}
      {enrichedMeetings.length === 0 ? (
        <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
          <FlowCardContent className="text-center py-16">
            <FileText className="h-12 w-12 text-[#667085] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#111111] mb-2">
              {t("meetings.emptyState")}
            </h3>
            <p className="text-sm text-[#667085] mb-6">
              {t("meetings.emptyStateDescription")}
            </p>
            <Link href="/app/meetings/new">
              <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
                <Plus className="mr-2 h-4 w-4" />
                {t("meetings.createMeeting")}
              </Button>
            </Link>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <MeetingsListWithFilters meetings={enrichedMeetings} />
      )}
    </div>
  );
}

