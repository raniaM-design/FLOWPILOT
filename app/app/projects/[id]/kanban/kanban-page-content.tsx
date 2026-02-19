"use client";

import { PageHeader } from "@/components/ui/page-header";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { ProjectKanbanBoard } from "./project-kanban-board";
import { ProjectNavigation } from "../project-navigation";
import { useFullscreen } from "./kanban-fullscreen-wrapper";

type ActionItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignee: {
    id: string;
    email: string;
  } | null;
  decision: {
    id: string;
    title: string;
  } | null;
  meeting: {
    id: string;
    title: string;
  } | null;
};

interface KanbanPageContentProps {
  project: {
    id: string;
    name: string;
    description: string | null;
  };
  actions: ActionItem[];
}

export function KanbanPageContent({ project, actions }: KanbanPageContentProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4">
          {/* Navigation */}
          <ProjectNavigation projectId={project.id} />

          <PageHeader
            title={project.name}
            subtitle={
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                {project.description && (
                  <span>{project.description}</span>
                )}
              </div>
            }
            actions={[
              {
                component: (
                  <EntityActionsMenu
                    entityType="project"
                    entityId={project.id}
                    entityLabel={project.name}
                    redirectTo="/app/projects"
                  />
                ),
              },
            ]}
          />

          <ProjectKanbanBoard 
            actions={actions} 
            projectId={project.id}
            isFullscreen={isFullscreen}
            onFullscreenToggle={toggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
}

