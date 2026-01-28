"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { CheckSquare, Calendar, Plus, FileText, Users } from "lucide-react";
import { formatShortDate } from "@/lib/timeUrgency";

interface Action {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null; // ISO string
  createdAt: string; // ISO string
  project: {
    id: string;
    name: string;
  };
  decision: {
    id: string;
    title: string;
  } | null;
  overdue: boolean;
  dueMeta: {
    label: string;
    color: string;
  };
}

interface ActionsListWithFiltersProps {
  actions: Action[];
}

export function ActionsListWithFilters({ actions }: ActionsListWithFiltersProps) {
  const [activeTab, setActiveTab] = useState<"all" | "inProgress" | "blocked" | "completed">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtrer selon l'onglet actif
  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case "inProgress":
        return actions.filter((a) => a.status === "DOING" || a.status === "TODO");
      case "blocked":
        return actions.filter((a) => a.status === "BLOCKED");
      case "completed":
        return actions.filter((a) => a.status === "DONE");
      default:
        return actions;
    }
  }, [actions, activeTab]);

  // Filtrer selon le filtre de statut
  const filteredActions = useMemo(() => {
    if (statusFilter === "all") {
      return filteredByTab;
    }
    return filteredByTab.filter((a) => a.status === statusFilter);
  }, [filteredByTab, statusFilter]);

  // Compter les actions par catégorie
  const counts = useMemo(() => {
    const all = actions.length;
    const inProgress = actions.filter((a) => a.status === "DOING" || a.status === "TODO").length;
    const blocked = actions.filter((a) => a.status === "BLOCKED").length;
    const completed = actions.filter((a) => a.status === "DONE").length;
    return { all, inProgress, blocked, completed };
  }, [actions]);

  // Calculer le pourcentage de complétion (simplifié pour l'exemple)
  const getCompletionRate = (action: Action) => {
    // Pour l'instant, on simule un pourcentage basé sur le statut
    if (action.status === "DONE") return 100;
    if (action.status === "DOING") return 50;
    if (action.status === "BLOCKED") return 20;
    return 0;
  };

  // Obtenir le variant du badge selon le statut
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DOING":
        return { variant: "success" as const, label: "En cours", className: "bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]" };
      case "BLOCKED":
        return { variant: "danger" as const, label: "Bloquée", className: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]" };
      case "DONE":
        return { variant: "success" as const, label: "Complétée", className: "bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]" };
      default:
        return { variant: "info" as const, label: "À faire", className: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]" };
    }
  };

  // Obtenir la couleur de la barre de progression
  const getProgressBarColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-[#16A34A]";
      case "DOING":
        return "bg-[#2563EB]";
      case "BLOCKED":
        return "bg-[#D97706]";
      default:
        return "bg-[#2563EB]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs et filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="bg-white border border-[#E5E7EB]">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              Toutes {counts.all > 0 && <span className="ml-1.5">({counts.all})</span>}
            </TabsTrigger>
            <TabsTrigger value="inProgress" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              En cours {counts.inProgress > 0 && <span className="ml-1.5">({counts.inProgress})</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="blocked" 
              className={`data-[state=active]:bg-[#2563EB] data-[state=active]:text-white ${counts.blocked > 0 ? "text-[#B91C1C]" : ""}`}
            >
              Bloquées {counts.blocked > 0 && <span className="ml-1.5">({counts.blocked})</span>}
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              Complétées {counts.completed > 0 && <span className="ml-1.5">({counts.completed})</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Dropdown filtre et compteur */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-[#667085]">
            <span>Filtrer : </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-[#111111] font-medium cursor-pointer"
            >
              <option value="all">Tous</option>
              <option value="DOING">En cours</option>
              <option value="TODO">À faire</option>
              <option value="BLOCKED">Bloquées</option>
              <option value="DONE">Complétées</option>
            </select>
          </div>
          <div className="px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <span className="text-sm font-semibold text-[#111111]">
              {filteredActions.length} résultat{filteredActions.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des actions */}
      {filteredActions.length === 0 ? (
        <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
          <FlowCardContent className="p-16 text-center">
            <p className="text-sm text-[#667085]">
              Aucune action ne correspond aux filtres sélectionnés.
            </p>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => {
            const statusStyle = getStatusVariant(action.status);
            const completionRate = getCompletionRate(action);
            const progressColor = getProgressBarColor(action.status);

            return (
              <Link key={action.id} href={`/app/projects/${action.project.id}?actionId=${action.id}`} className="block group">
                <FlowCard variant="default" className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200">
                  <FlowCardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* En-tête avec icône et titre */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-[#2563EB]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[#111111] mb-1 group-hover:text-[#2563EB] transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-[#667085]">
                              {action.project.name}
                            </p>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#667085]">Avancement</span>
                            <span className="text-sm font-medium text-[#111111]">{completionRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressColor} transition-all duration-300`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Badge de statut et métadonnées */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                          <div className="flex items-center gap-3">
                            <Chip variant={statusStyle.variant} size="sm" className={statusStyle.className}>
                              {statusStyle.label}
                            </Chip>
                            {action.dueDate && (
                              <span className="text-xs text-[#667085] flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatShortDate(new Date(action.dueDate))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Placeholder pour avatars */}
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full bg-[#E5E7EB] border-2 border-white"
                                />
                              ))}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-sm border-[#E5E7EB] hover:bg-[#F1F5F9]"
                              onClick={(e) => {
                                e.preventDefault();
                                // TODO: Ouvrir modal pour ajouter action
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Ajouter action
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FlowCardContent>
                </FlowCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

