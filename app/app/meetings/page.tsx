import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslations } from "@/i18n/request";
import { MeetingsListWithFilters } from "@/components/meetings/meetings-list-with-filters";
import { buildMeetingListAnalysisMeta } from "@/lib/meetings/meeting-list-meta";

const MEETINGS_TABS = ["upcoming", "analyzed", "notAnalyzed", "archived"] as const;

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();
  const t = await getTranslations();
  const sp = await searchParams;
  const initialTab = MEETINGS_TABS.includes(sp.tab as (typeof MEETINGS_TABS)[number])
    ? (sp.tab as (typeof MEETINGS_TABS)[number])
    : undefined;

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
      const projectFromActions = meeting.actions.find((a: MeetingWithRelations['actions'][0]) => a.project)?.project;
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
        .filter((a: MeetingWithRelations['actions'][0]) => a.decision)
        .map((a: MeetingWithRelations['actions'][0]) => a.decision!.id)
    );
    const decisionsCount = uniqueDecisions.size;

    // Compter les notes (basé sur raw_notes)
    const notesCount = meeting.raw_notes ? Math.ceil(meeting.raw_notes.length / 100) : 0;

    const analysisMeta = buildMeetingListAnalysisMeta(
      meeting.analysisJson ?? null,
      meeting.analyzedAt ?? null,
      meeting.actions.length,
      decisionsCount,
    );

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
      canQuickAnalyze: meeting.ownerId === userId,
      hasNotes: !!(meeting.raw_notes && meeting.raw_notes.trim().length > 0),
      analysisStatus: analysisMeta.analysisStatus,
      extractedActionsCount: analysisMeta.extractedActionsCount,
      extractedDecisionsCount: analysisMeta.extractedDecisionsCount,
      displayActionsCount: analysisMeta.displayActionsCount,
      displayDecisionsCount: analysisMeta.displayDecisionsCount,
      analysisQuality: analysisMeta.analysisQuality,
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
              Nouveau compte rendu
            </Button>
          </Link>
        </div>
      </div>

      {/* Liste des réunions avec filtres */}
      {enrichedMeetings.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("meetings.emptyState")}
          description={`${t("meetings.emptyStateDescription")} Connecte ton calendrier Outlook pour importer automatiquement tes réunions à venir.`}
          ctaLabel="Voir l'intégration"
          ctaAction="/app/integrations/outlook"
        />
      ) : (
        <MeetingsListWithFilters
          meetings={enrichedMeetings}
          initialTab={initialTab}
        />
      )}
    </div>
  );
}

