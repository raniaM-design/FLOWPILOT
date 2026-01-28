"use client";

import Link from "next/link";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { Calendar, ArrowRight, ListTodo } from "lucide-react";

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
  
  // Calculer le total des éléments pour affichage
  const totalElements = (project._count?.decisions || 0) + (project._count?.actions || 0);

  return (
    <div className="relative group">
      <Link href={`/app/projects/${project.id}`} className="block h-full">
        <div className="h-full bg-white border border-[#E5E7EB] rounded-xl p-7 hover:border-[#2563EB]/30 transition-all duration-200 hover:shadow-sm">
          {/* En-tête : Nom du projet + Badge statut */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-[#111111] mb-2 leading-tight group-hover:text-[#2563EB] transition-colors line-clamp-2">
                {project.name}
              </h3>
            </div>
            <div className="flex-shrink-0">
              {project.status === "ACTIVE" ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]">
                  {getStatusLabel(project.status)}
                </span>
              ) : project.status === "PAUSED" ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                  {getStatusLabel(project.status)}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-[#667085] border border-[#E5E7EB]">
                  {getStatusLabel(project.status)}
                </span>
              )}
            </div>
          </div>

          {/* Description - lisible */}
          {project.description && (
            <p className="text-sm text-[#667085] mb-6 line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {project.description}
            </p>
          )}

          {/* Métadonnées : Date + Éléments */}
          <div className="flex items-center justify-between pt-5 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs text-[#667085]">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(project.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            
            {hasStats && totalElements > 0 && (
              <div className="flex items-center gap-4 text-xs text-[#667085]">
                {project._count?.decisions !== undefined && project._count.decisions > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ListTodo className="h-3.5 w-3.5" />
                    <span className="font-medium">{project._count.decisions}</span>
                  </div>
                )}
                {project._count?.actions !== undefined && project._count.actions > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span className="font-medium">{project._count.actions}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Menu actions positionné en overlay */}
      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

