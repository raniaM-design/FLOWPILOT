import { prisma } from "@/lib/db";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { ProjectKanbanBoard } from "./project-kanban-board";
import { ProjectNavigation } from "../project-navigation";
import { KanbanFullscreenWrapper } from "./kanban-fullscreen-wrapper";
import { KanbanPageContent } from "./kanban-page-content";

export default async function ProjectKanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserIdOrThrow();

  const { id } = await params;

  // Charger le projet
  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Charger toutes les actions du projet avec assignee, decision et meeting
  const actionsRaw = await prisma.actionItem.findMany({
    where: {
      projectId: id,
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
      meeting: {
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

  return (
    <KanbanFullscreenWrapper projectId={project.id}>
      <KanbanPageContent
        project={project}
        actions={actions}
      />
    </KanbanFullscreenWrapper>
  );
}

