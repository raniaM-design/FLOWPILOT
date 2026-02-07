"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Search, Filter } from "lucide-react";
import { ProjectCardPremium } from "./project-card-premium";
import { useSearch } from "@/contexts/search-context";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  _count?: {
    decisions?: number;
    actions?: number;
  };
}

interface ProjectsListWithSearchProps {
  projects: Project[];
}

export function ProjectsListWithSearch({ projects }: ProjectsListWithSearchProps) {
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useSearch();
  const [localSearchQuery, setLocalSearchQuery] = useState(globalSearchQuery);

  // Synchroniser la recherche locale avec la recherche globale quand elle change depuis le header
  useEffect(() => {
    setLocalSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  // Utiliser la recherche locale pour l'affichage, mais filtrer avec la recherche globale si locale est vide
  // Cela permet de garder la recherche du header active même si l'utilisateur efface le champ local
  const effectiveSearchQuery = localSearchQuery || globalSearchQuery;

  // Filtrer les projets selon la recherche
  const filteredProjects = useMemo(() => {
    if (!effectiveSearchQuery || !effectiveSearchQuery.trim()) {
      return projects;
    }

    const query = effectiveSearchQuery.toLowerCase().trim();
    const filtered = projects.filter((project) => {
      const nameMatch = project.name?.toLowerCase().includes(query) || false;
      const descriptionMatch = project.description?.toLowerCase().includes(query) || false;
      return nameMatch || descriptionMatch;
    });
    
    // Log pour déboguer
    if (effectiveSearchQuery.trim()) {
      console.log("[ProjectsList] Recherche:", effectiveSearchQuery, "- Résultats:", filtered.length, "/", projects.length);
    }
    
    return filtered;
  }, [projects, effectiveSearchQuery]);

  return (
    <>
      {/* Zone recherche compacte */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Champ de recherche réduit */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Rechercher un projet…"
                value={localSearchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalSearchQuery(value);
                  setGlobalSearchQuery(value);
                }}
                className="!pl-9 pr-3 h-9 bg-slate-50 border-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 text-sm shadow-sm"
              />
            </div>

            {/* Compteur compact */}
            <div className="px-3 py-1.5 bg-blue-100 rounded-lg flex-shrink-0">
              <span className="text-sm font-semibold text-blue-700">
                {filteredProjects.length}
                {effectiveSearchQuery && filteredProjects.length !== projects.length && (
                  <span className="text-blue-600 font-normal ml-1">/ {projects.length}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Liste des projets filtrés */}
      {filteredProjects.length === 0 ? (
        <FlowCard variant="default" className="bg-white border-0 shadow-sm">
          <FlowCardContent className="flex flex-col items-center justify-center py-24 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Aucun projet trouvé
            </h3>
            <p className="text-sm text-slate-600 text-center max-w-md leading-relaxed">
              {effectiveSearchQuery
                ? `Aucun projet ne correspond à "${effectiveSearchQuery}". Essayez avec d'autres mots-clés.`
                : "Aucun projet disponible."}
            </p>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCardPremium key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}

