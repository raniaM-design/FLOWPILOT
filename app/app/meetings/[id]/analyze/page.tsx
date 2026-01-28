import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { MeetingAnalyzer } from "./meeting-analyzer";
import { formatShortDate } from "@/lib/timeUrgency";
import { Calendar, Users as UsersIcon } from "lucide-react";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";

export default async function AnalyzeMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  const meeting = await prisma.meeting.findFirst({
    where: {
      id,
      ownerId: userId,
    },
    select: {
      id: true,
      title: true,
      date: true,
      participants: true,
      raw_notes: true,
      analysisJson: true,
      analyzedAt: true,
    },
  });

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

          <MeetingAnalyzer 
            meeting={{
              id: meeting.id,
              title: meeting.title,
              raw_notes: meeting.raw_notes,
              analysisJson: meeting.analysisJson,
              analyzedAt: meeting.analyzedAt,
            }} 
          />
        </div>
      </div>
    </div>
  );
}

