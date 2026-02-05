"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const { searchQuery: globalSearchQuery, setSearchQuery: setGlobalSearchQuery } = useSearch();

  // Synchroniser la recherche locale avec la recherche globale
  useEffect(() => {
    if (globalSearchQuery) {
      setLocalSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Utiliser la recherche locale ou globale (priorité à la locale si l'utilisateur tape dans le champ)
  const searchQuery = localSearchQuery || globalSearchQuery;

  // Filtrer les projets selon la recherche
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }

    const query = searchQuery.toLowerCase().trim();
    return projects.filter((project) => {
      const nameMatch = project.name.toLowerCase().includes(query);
      const descriptionMatch = project.description?.toLowerCase().includes(query) || false;
      return nameMatch || descriptionMatch;
    });
  }, [projects, searchQuery]);

  return (
    <>
      {/* Zone recherche & filtres - plus visible */}
      {projects.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Champ de recherche - plus présent */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#667085]" />
              <Input
                type="search"
                placeholder="Rechercher un projet par nom ou description…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!pl-[3.5rem] pr-3 h-12 bg-white border-[#E5E7EB] text-[#111111] placeholder:text-[#667085] focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 text-base"
              />
            </div>

            {/* Filtres et compteur */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Filtre statut - discret */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-[#667085] cursor-not-allowed opacity-60">
                <Filter className="h-3.5 w-3.5" />
                <span>Tous</span>
              </div>

              {/* Compteur - indication claire */}
              <div className="px-4 py-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <span className="text-sm font-semibold text-[#111111]">
                  {filteredProjects.length} {filteredProjects.length > 1 ? "projets" : "projet"}
                  {searchQuery && filteredProjects.length !== projects.length && (
                    <span className="text-[#667085] font-normal ml-1">
                      sur {projects.length}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des projets filtrés */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-white rounded-xl border border-[#E5E7EB]">
          <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-6 border border-[#E5E7EB]">
            <Search className="h-8 w-8 text-[#667085]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111111] mb-2">
            Aucun projet trouvé
          </h3>
          <p className="text-sm text-[#667085] text-center max-w-md leading-relaxed">
            {searchQuery
              ? `Aucun projet ne correspond à "${searchQuery}". Essayez avec d'autres mots-clés.`
              : "Aucun projet disponible."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCardPremium key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}

