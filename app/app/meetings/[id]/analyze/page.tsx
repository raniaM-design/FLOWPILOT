import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { MeetingAnalyzer } from "./meeting-analyzer";
import { formatShortDate } from "@/lib/timeUrgency";
import { Calendar, Users as UsersIcon } from "lucide-react";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { MeetingMentionsEditor } from "@/components/meetings/meeting-mentions-editor";
import { TranscriptionManager, type TranscriptionJob } from "@/components/meetings/transcription-manager";

export default async function AnalyzeMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Vérifier les permissions : propriétaire, mentionné, ou membre du projet
  // Note: transcriptionJobs chargés séparément car la table peut avoir des colonnes manquantes (audioDeletedAt, etc.)
  const meeting = await prisma.meeting.findFirst({
    where: {
      id,
      OR: [
        { ownerId: userId },
        {
          mentions: {
            some: { userId },
          },
        },
        {
          project: {
            ownerId: userId,
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      date: true,
      participants: true,
      raw_notes: true,
      analysisJson: true,
      analyzedAt: true,
      ownerId: true,
    },
  });

  // Charger les transcriptions avec requête raw (résilient si colonnes manquantes)
  let transcriptionJobs: TranscriptionJob[] = [];
  if (meeting) {
    try {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          status: string;
          transcribedText: string | null;
          errorMessage: string | null;
          createdAt: Date;
          completedAt: Date | null;
        }>
      >`SELECT id, status, "transcribedText", "errorMessage", "createdAt", "completedAt" FROM "MeetingTranscriptionJob" WHERE "meetingId" = ${id} ORDER BY "createdAt" DESC`;
      transcriptionJobs = rows.map((r) => ({
        ...r,
        status: r.status as TranscriptionJob["status"],
        audioDeletedAt: null,
        deletedAt: null,
        consentRecording: false,
        consentProcessing: false,
        consentDate: null,
      }));
    } catch {
      // Table ou colonnes manquantes - ignorer les transcriptions
    }
  }

  if (!meeting) {
    notFound();
  }

  // Formater la date de dernière analyse
  const formatAnalysisDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Construire le sous-titre avec date, participants et dernière analyse
  const subtitleParts = [
    <span key="date" className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4" />
      {formatShortDate(meeting.date)}
    </span>,
  ];
  
  if (meeting.participants) {
    subtitleParts.push(
      <span key="participants" className="flex items-center gap-1.5">
        <UsersIcon className="h-4 w-4" />
        {meeting.participants}
      </span>
    );
  }
  
  if (meeting.analyzedAt) {
    subtitleParts.push(
      <span key="analysis" className="text-muted-foreground">
        Dernière analyse : {formatAnalysisDate(meeting.analyzedAt)}
      </span>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <PageHeader
            title={meeting.title}
            subtitle={
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                {subtitleParts}
              </div>
            }
            actions={[
              {
                label: "Retour aux réunions",
                href: "/app/meetings",
                variant: "outline",
              },
              {
                component: (
                  <EntityActionsMenu
                    entityType="meeting"
                    entityId={meeting.id}
                    entityLabel={meeting.title}
                    redirectTo="/app/meetings"
                  />
                ),
              },
            ]}
          />

          {/* Gestionnaire de transcriptions */}
          {transcriptionJobs.length > 0 && (
            <TranscriptionManager
              meetingId={meeting.id}
              transcriptionJobs={transcriptionJobs}
              isOwner={meeting.ownerId === userId}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MeetingAnalyzer 
                meeting={{
                  id: meeting.id,
                  title: meeting.title,
                  raw_notes: meeting.raw_notes ?? "",
                  analysisJson: meeting.analysisJson,
                  analyzedAt: meeting.analyzedAt,
                }} 
              />
            </div>
            <div className="lg:col-span-1">
              <MeetingMentionsEditor meetingId={meeting.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

