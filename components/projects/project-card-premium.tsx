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
  
  // Style selon le statut
  const getCardStyle = () => {
    if (isActive) {
      return {
        borderColor: "border-l-blue-500",
        bgGradient: "bg-gradient-to-br from-blue-50/40 via-white to-blue-50/20",
      };
    }
    if (isPaused) {
      return {
        borderColor: "border-l-amber-500",
        bgGradient: "bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20",
      };
    }
    return {
      borderColor: "border-l-slate-300",
      bgGradient: "bg-gradient-to-br from-slate-50/40 via-white to-slate-50/20",
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
        <FlowCard 
          variant="default" 
          className={cn(
            "bg-white border border-slate-200/60 rounded-xl shadow-sm transition-all duration-200",
            "hover:shadow-md hover:border-blue-300/40 hover:-translate-y-0.5",
            cardStyle.borderColor,
            cardStyle.bgGradient,
            "border-l-[3px]",
            "h-full"
          )}
        >
          <FlowCardContent className="p-5">
            <div className="space-y-4">
              {/* Header : Titre + Badge */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {project.name}
                    </h3>
                  </div>
                  <Chip 
                    variant={isActive ? "success" : isPaused ? "warning" : "neutral"}
                    size="sm"
                    className="text-xs font-medium flex-shrink-0"
                  >
                    {getStatusLabel(project.status)}
                  </Chip>
                </div>
                
                {/* Description */}
                {project.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Bloc d'information */}
              <div className="space-y-3 pt-3 border-t border-slate-200/60">
                {/* Date de création */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/40 border border-slate-200/60">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-0.5">Créé</div>
                    <div className="text-sm font-medium text-slate-600">
                      {formatDate(project.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {hasStats && (project._count?.decisions || project._count?.actions) && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/40 border border-blue-100/60">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-600 mb-0.5">Contenu</div>
                      <div className="flex items-center gap-4">
                        {project._count?.decisions !== undefined && project._count.decisions > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Scale className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-slate-900">{project._count.decisions}</span>
                            <span className="text-xs text-slate-500">décisions</span>
                          </div>
                        )}
                        {project._count?.actions !== undefined && project._count.actions > 0 && (
                          <div className="flex items-center gap-1.5">
                            <ListTodo className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-slate-900">{project._count.actions}</span>
                            <span className="text-xs text-slate-500">actions</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FlowCardContent>
        </FlowCard>
      </Link>

      {/* Menu actions positionné en overlay */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

