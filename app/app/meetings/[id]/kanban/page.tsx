import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { formatShortDate } from "@/lib/timeUrgency";
import { Calendar, Users as UsersIcon } from "lucide-react";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { MeetingActionsView } from "./meeting-actions-view";
import { InviteCollaborator } from "@/components/collaboration/invite-collaborator";
import { CollaboratorsList } from "@/components/collaboration/collaborators-list";

export default async function MeetingKanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Charger la réunion avec le projet associé
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
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!meeting) {
    notFound();
  }

  // Charger les actions de la réunion avec assignee et decision
  const actionsRaw = await prisma.actionItem.findMany({
    where: {
      meetingId: id,
      project: {
        ownerId: userId,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      assignee: {
        select: {
          id: true,
          email: true,
        },
      },
      decision: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Sérialiser les dates pour le client
  const actions = actionsRaw.map((action) => ({
    ...action,
    dueDate: action.dueDate ? action.dueDate.toISOString() : null,
  }));

  // Construire le sous-titre avec date et participants
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

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
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
                    label: "Analyse",
                    href: `/app/meetings/${meeting.id}/analyze`,
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
            </div>
            <div className="flex flex-col gap-2">
              <InviteCollaborator entityType="meeting" entityId={meeting.id} />
              <CollaboratorsList entityType="meeting" entityId={meeting.id} />
            </div>
          </div>

          <MeetingActionsView 
            actions={actions} 
            projectId={meeting.projectId}
            projectName={meeting.project?.name}
            meetingId={meeting.id}
          />
        </div>
      </div>
    </div>
  );
}

