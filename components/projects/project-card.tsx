"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
  };
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "PAUSED":
      return "secondary";
    case "DONE":
      return "outline";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Actif";
    case "PAUSED":
      return "En pause";
    case "DONE":
      return "Terminé";
    default:
      return status;
  }
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="relative group">
      <Link href={`/app/projects/${project.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl flex-1">{project.name}</CardTitle>
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            {project.description && (
              <CardDescription className="line-clamp-2 mt-2">
                {project.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Créé le {new Date(project.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </CardContent>
        </Card>
      </Link>
      {/* Menu actions positionné en overlay */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <EntityActionsMenu
          entityType="project"
          entityId={project.id}
          entityLabel={project.name}
          redirectTo="/app/projects"
        />
      </div>
    </div>
  );
}

