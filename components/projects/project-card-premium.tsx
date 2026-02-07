"use client";

import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { Calendar, ArrowRight, ListTodo, FolderKanban, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardPremiumProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    _count?: {
      decisions?: number;
      actions?: number;
    };
  };
}

const getStatusLabel = (status: string): string => {
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

export function ProjectCardPremium({ project }: ProjectCardPremiumProps) {
  const hasStats = project._count && (project._count.decisions !== undefined || project._count.actions !== undefined);
  const isActive = project.status === "ACTIVE";
  const isPaused = project.status === "PAUSED";
  
  // Style selon le statut avec couleurs vives
  const getCardStyle = () => {
    if (isActive) {
      return {
        borderColor: "border-blue-200",
        bgGradient: "bg-gradient-to-br from-blue-50 to-white",
        headerBg: "bg-blue-100",
        iconColor: "text-blue-600",
        tabBorder: "bg-blue-300",
      };
    }
    if (isPaused) {
      return {
        borderColor: "border-orange-200",
        bgGradient: "bg-gradient-to-br from-orange-50 to-white",
        headerBg: "bg-orange-100",
        iconColor: "text-orange-600",
        tabBorder: "bg-orange-300",
      };
    }
    return {
      borderColor: "border-emerald-200",
      bgGradient: "bg-gradient-to-br from-emerald-50 to-white",
      headerBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      tabBorder: "bg-emerald-300",
    };
  };

  const cardStyle = getCardStyle();

  // Format date
  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const projectDate = new Date(date);
    projectDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - projectDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return projectDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: projectDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="relative group">
      <Link href={`/app/projects/${project.id}`} className="block h-full">
        {/* Design de dossier avec tab */}
        <div className={cn(
          "relative h-full rounded-lg shadow-lg transition-all duration-200",
          "hover:shadow-xl hover:-translate-y-1",
          cardStyle.bgGradient,
          cardStyle.borderColor,
          "border-2",
          "overflow-hidden"
        )}>
          {/* Tab de dossier en haut - forme de dossier */}
          <div className={cn("h-10 relative", cardStyle.headerBg)}>
            {/* Tab gauche arrondi */}
            <div className={cn(
              "absolute top-0 left-0 w-16 h-10",
              cardStyle.headerBg
            )} 
            style={{
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)",
            }} />
            {/* Tab droit */}
            <div className={cn(
              "absolute top-0 right-0 w-12 h-10 rounded-tr-lg",
              cardStyle.headerBg
            )} />
            {/* Ligne de séparation colorée */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-1",
              cardStyle.tabBorder
            )} />
          </div>

          {/* Contenu du dossier */}
          <div className="p-5 space-y-4">
            {/* Header avec icône de dossier et titre */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-lg", cardStyle.headerBg)}>
                    <FolderKanban className={cn("h-5 w-5", cardStyle.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-base font-bold line-clamp-2 leading-snug group-hover:opacity-80 transition-opacity", cardStyle.iconColor)}>
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-slate-600 line-clamp-1 leading-relaxed mt-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Chip 
                variant={isActive ? "success" : isPaused ? "warning" : "neutral"}
                size="sm"
                className="text-xs font-semibold flex-shrink-0"
              >
                {getStatusLabel(project.status)}
              </Chip>
            </div>

            {/* Stats colorées */}
            {hasStats && (project._count?.decisions || project._count?.actions) && (
              <div className="flex items-center gap-3 flex-wrap pt-2">
                {project._count?.decisions !== undefined && project._count.decisions > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-lg">
                    <Scale className="h-4 w-4 text-emerald-700" />
                    <span className="text-sm font-bold text-emerald-700">{project._count.decisions}</span>
                    <span className="text-xs text-emerald-600 font-medium">décisions</span>
                  </div>
                )}
                {project._count?.actions !== undefined && project._count.actions > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 rounded-lg">
                    <ListTodo className="h-4 w-4 text-indigo-700" />
                    <span className="text-sm font-bold text-indigo-700">{project._count.actions}</span>
                    <span className="text-xs text-indigo-600 font-medium">actions</span>
                  </div>
                )}
              </div>
            )}

            {/* Date en bas */}
            <div className="flex items-center gap-2 pt-3">
              <Calendar className={cn("h-4 w-4", cardStyle.iconColor)} />
              <span className="text-xs text-slate-600">
                {formatDate(project.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Menu actions positionné en overlay */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

