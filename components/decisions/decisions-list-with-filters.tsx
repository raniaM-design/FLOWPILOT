"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { Target, Calendar, CheckSquare, Plus } from "lucide-react";
import { formatShortDate, isOverdue } from "@/lib/timeUrgency";
import { useSearch } from "@/contexts/search-context";

interface DecisionMeta {
  risk: {
    level: "GREEN" | "YELLOW" | "RED";
    reason: string;
  };
  actionCount: number;
  nextDueDate: Date | null;
}

interface Decision {
  id: string;
  title: string;
  status: string;
  createdAt: string; // ISO string
  project: {
    id: string;
    name: string;
  };
  actions: Array<{
    id: string;
    status: string;
    dueDate: string | null; // ISO string
  }>;
  meta: DecisionMeta;
}

interface DecisionsListWithFiltersProps {
  decisions: Decision[];
}

export function DecisionsListWithFilters({ decisions }: DecisionsListWithFiltersProps) {
  const [activeTab, setActiveTab] = useState<"all" | "monitoring" | "decided" | "archived">("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const { searchQuery } = useSearch();

  // Les métadonnées sont déjà calculées côté serveur
  const decisionsWithMeta = useMemo(() => {
    return decisions.map((decision) => ({
      decision,
      meta: decision.meta,
    }));
  }, [decisions]);

  // Filtrer selon l'onglet actif
  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case "monitoring":
        return decisionsWithMeta.filter(
          ({ meta }) => meta.risk.level === "RED" || meta.risk.level === "YELLOW"
        );
      case "decided":
        return decisionsWithMeta.filter(({ decision }) => decision.status === "DECIDED");
      case "archived":
        return decisionsWithMeta.filter(({ decision }) => decision.status === "ARCHIVED");
      default:
        return decisionsWithMeta;
    }
  }, [decisionsWithMeta, activeTab]);

  // Filtrer selon le filtre de risque
  const filteredByRisk = useMemo(() => {
    if (riskFilter === "all") {
      return filteredByTab;
    }
    return filteredByTab.filter(({ meta }) => meta.risk.level === riskFilter);
  }, [filteredByTab, riskFilter]);

  // Filtrer selon la recherche textuelle
  const filteredDecisions = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByRisk;
    }

    const query = searchQuery.toLowerCase().trim();
    return filteredByRisk.filter(({ decision }) => {
      const titleMatch = decision.title.toLowerCase().includes(query);
      const projectMatch = decision.project.name.toLowerCase().includes(query);
      return titleMatch || projectMatch;
    });
  }, [filteredByRisk, searchQuery]);

  // Compter les décisions par catégorie (toujours sur toutes les décisions, pas filtrées par risque)
  // Le filtre de risque n'affecte que l'affichage, pas les compteurs des onglets
  const counts = useMemo(() => {
    const all = decisionsWithMeta.length;
    const monitoring = decisionsWithMeta.filter(
      ({ meta }) => meta.risk.level === "RED" || meta.risk.level === "YELLOW"
    ).length;
    const decided = decisionsWithMeta.filter(({ decision }) => decision.status === "DECIDED").length;
    const archived = decisionsWithMeta.filter(({ decision }) => decision.status === "ARCHIVED").length;
    
    return { all, monitoring, decided, archived };
  }, [decisionsWithMeta]);

  // Grouper les décisions selon l'onglet sélectionné
  const decidedDecisions = useMemo(() => {
    // Si l'onglet "decided" est sélectionné, afficher toutes les décisions filtrées
    if (activeTab === "decided") {
      return filteredDecisions;
    }
    // Si l'onglet "all" est sélectionné, afficher seulement les décisions décidées
    if (activeTab === "all") {
      return filteredDecisions.filter(({ decision }) => decision.status === "DECIDED");
    }
    // Pour les autres onglets, ne pas afficher de décisions décidées
    return [];
  }, [filteredDecisions, activeTab]);

  const archivedDecisions = useMemo(() => {
    // Si l'onglet "archived" est sélectionné, afficher toutes les décisions filtrées
    if (activeTab === "archived") {
      return filteredDecisions;
    }
    // Si l'onglet "all" est sélectionné, afficher seulement les décisions archivées
    if (activeTab === "all") {
      return filteredDecisions.filter(({ decision }) => decision.status === "ARCHIVED");
    }
    // Pour les autres onglets, ne pas afficher de décisions archivées
    return [];
  }, [filteredDecisions, activeTab]);

  const activeDecisions = useMemo(() => {
    // Si l'onglet "decided" ou "archived" est sélectionné, ne pas afficher de décisions actives
    if (activeTab === "decided" || activeTab === "archived") {
      return [];
    }
    // Sinon, filtrer les décisions actives (non décidées et non archivées)
    return filteredDecisions.filter(({ decision }) => decision.status !== "DECIDED" && decision.status !== "ARCHIVED");
  }, [filteredDecisions, activeTab]);

  // Calculer le pourcentage de complétion
  const getCompletionRate = (decision: Decision) => {
    const doneActions = decision.actions.filter((a) => a.status === "DONE").length;
    return decision.actions.length > 0
      ? Math.round((doneActions / decision.actions.length) * 100)
      : 0;
  };

  // Obtenir la prochaine échéance depuis les métadonnées
  const getNextDueDate = (meta: DecisionMeta) => {
    if (!meta.nextDueDate) return null;
    return new Date(meta.nextDueDate);
  };

  // Obtenir le style du badge selon le statut et le risque
  const getBadgeStyle = (status: string, riskLevel: string) => {
    if (riskLevel === "RED" || riskLevel === "YELLOW") {
      return {
        variant: "warning" as const,
        label: "En risque",
        className: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
      };
    }
    if (status === "BLOCKED") {
      return {
        variant: "danger" as const,
        label: "Bloquée",
        className: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
      };
    }
    return null;
  };

  // Formater la date d'échéance
  const formatDueDate = (date: Date | null) => {
    if (!date) return null;
    return formatShortDate(date);
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
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              À surveiller {counts.monitoring > 0 && <span className="ml-1.5">({counts.monitoring})</span>}
            </TabsTrigger>
            <TabsTrigger value="decided" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              Décidées {counts.decided > 0 && <span className="ml-1.5">({counts.decided})</span>}
            </TabsTrigger>
            <TabsTrigger value="archived" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
              Archivées {counts.archived > 0 && <span className="ml-1.5">({counts.archived})</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Dropdown filtre et compteur */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-[#667085]">
            <span>Filtrer : </span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-[#111111] font-medium cursor-pointer"
            >
              <option value="all">Tous</option>
              <option value="RED">En risque</option>
              <option value="YELLOW">À surveiller</option>
              <option value="GREEN">OK</option>
            </select>
          </div>
          <div className="px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <span className="text-sm font-semibold text-[#111111]">
              {filteredDecisions.length} résultat{filteredDecisions.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des décisions actives */}
      {activeDecisions.length > 0 && (
        <div className="space-y-4">
          {activeDecisions.map(({ decision, meta }) => {
            const badgeStyle = getBadgeStyle(decision.status, meta.risk.level);
            const completionRate = getCompletionRate(decision);
            const nextDue = getNextDueDate(meta);
            const isOverdueDate = nextDue ? isOverdue(nextDue, "TODO", new Date()) : false;

            return (
              <Link key={decision.id} href={`/app/decisions/${decision.id}`} className="block group">
                <FlowCard variant="default" className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200">
                  <FlowCardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* En-tête avec badge et date */}
                        <div className="flex items-center gap-3 mb-3">
                          {badgeStyle && (
                            <Chip variant={badgeStyle.variant} size="sm" className={badgeStyle.className}>
                              {badgeStyle.label}
                            </Chip>
                          )}
                          {nextDue && (
                            <span className="text-sm text-[#667085]">
                              {formatDueDate(nextDue)}
                            </span>
                          )}
                        </div>

                        {/* Titre */}
                        <div className="flex items-start gap-2 mb-2">
                          <Target className="mt-0.5 h-4 w-4 text-[#667085] flex-shrink-0" strokeWidth={1.75} />
                          <h3 className="text-lg font-semibold text-[#111111] group-hover:text-[#2563EB] transition-colors">
                            {decision.title}
                          </h3>
                        </div>

                        {/* Sous-titre (projet) */}
                        <p className="text-sm text-[#667085] mb-4">
                          {decision.project.name}
                        </p>

                        {/* Barre de progression */}
                        {decision.actions.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-[#667085]">Avancement</span>
                              <span className="text-sm font-medium text-[#111111]">{completionRate}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2563EB] transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Échéance et actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                          <div className="flex items-center gap-4 text-sm text-[#667085]">
                            {nextDue && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                Échéance: {formatDueDate(nextDue)}
                                {isOverdueDate && (
                                  <span className="text-[#B91C1C] font-medium ml-1">(En retard)</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-sm border-[#E5E7EB] hover:bg-[#F1F5F9]"
                              onClick={(e) => {
                                e.preventDefault();
                                // TODO: Ouvrir modal pour ajouter actions
                              }}
                            >
                              Ajouter actions
                            </Button>
                            <div className="flex items-center gap-1 px-2">
                              <div className="flex -space-x-2">
                                {/* Placeholder pour avatars */}
                                {[1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className="w-6 h-6 rounded-full bg-[#E5E7EB] border-2 border-white"
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-[#667085] ml-1">3</span>
                            </div>
                            <Button
                              size="sm"
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                              onClick={(e) => {
                                e.preventDefault();
                                // TODO: Ouvrir modal pour décider
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Décider
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

      {/* Section Décidées */}
      {decidedDecisions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-5 w-5 text-[#16A34A]" />
            <h2 className="text-lg font-semibold text-[#16A34A]">
              Décidée
              {decidedDecisions[0]?.decision.createdAt && (
                <span className="text-sm font-normal text-[#667085] ml-2">
                  {new Date(decidedDecisions[0].decision.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </h2>
          </div>
          {decidedDecisions.map(({ decision, meta }) => (
            <Link key={decision.id} href={`/app/decisions/${decision.id}`} className="block group">
              <FlowCard variant="default" className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200">
                <FlowCardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-5 w-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#111111] group-hover:text-[#2563EB] transition-colors mb-1">
                        {decision.title}
                      </h3>
                      <p className="text-sm text-[#667085]">
                        {meta.actionCount} action{meta.actionCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </FlowCardContent>
              </FlowCard>
            </Link>
          ))}
        </div>
      )}

      {/* Section Archivées */}
      {archivedDecisions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-5 w-5 text-[#667085]" />
            <h2 className="text-lg font-semibold text-[#667085]">
              Archivées
            </h2>
          </div>
          {archivedDecisions.map(({ decision, meta }) => (
            <Link key={decision.id} href={`/app/decisions/${decision.id}`} className="block group">
              <FlowCard variant="default" className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200 opacity-75">
                <FlowCardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-5 w-5 text-[#667085] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#111111] group-hover:text-[#2563EB] transition-colors mb-1">
                        {decision.title}
                      </h3>
                      <p className="text-sm text-[#667085]">
                        {meta.actionCount} action{meta.actionCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </FlowCardContent>
              </FlowCard>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredDecisions.length === 0 && (
        <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
          <FlowCardContent className="p-16 text-center">
            <p className="text-sm text-[#667085]">
              Aucune décision ne correspond aux filtres sélectionnés.
            </p>
          </FlowCardContent>
        </FlowCard>
      )}
    </div>
  );
}

