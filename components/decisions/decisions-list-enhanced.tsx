"use client";

import { useState, useMemo } from "react";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { useSearch } from "@/contexts/search-context";
import { DecisionCardEnhanced } from "./decision-card-enhanced";
import { DecisionsContextBar } from "./decisions-context-bar";
import { DecisionsFiltersEnhanced, SortOption, ActionFilter } from "./decisions-filters-enhanced";
import { isOverdue } from "@/lib/timeUrgency";

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
  createdAt: string;
  project: {
    id: string;
    name: string;
  };
  actions: Array<{
    id: string;
    status: string;
    dueDate: string | null;
  }>;
  meta: DecisionMeta;
}

interface DecisionsListEnhancedProps {
  decisions: Decision[];
}

export function DecisionsListEnhanced({ decisions }: DecisionsListEnhancedProps) {
  const [activeTab, setActiveTab] = useState<"all" | "monitoring" | "decided" | "archived">("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const { searchQuery } = useSearch();

  // Filtrer selon l'onglet actif
  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case "monitoring":
        return decisions.filter(
          (d) => d.meta.risk.level === "RED" || d.meta.risk.level === "YELLOW"
        );
      case "decided":
        return decisions.filter((d) => d.status === "DECIDED");
      case "archived":
        return decisions.filter((d) => d.status === "ARCHIVED");
      default:
        return decisions;
    }
  }, [decisions, activeTab]);

  // Filtrer selon le risque
  const filteredByRisk = useMemo(() => {
    if (riskFilter === "all") {
      return filteredByTab;
    }
    return filteredByTab.filter((d) => d.meta.risk.level === riskFilter);
  }, [filteredByTab, riskFilter]);

  // Filtrer selon les actions
  const filteredByActions = useMemo(() => {
    if (actionFilter === "all") {
      return filteredByRisk;
    }
    if (actionFilter === "with") {
      return filteredByRisk.filter((d) => d.meta.actionCount > 0);
    }
    return filteredByRisk.filter((d) => d.meta.actionCount === 0);
  }, [filteredByRisk, actionFilter]);

  // Filtrer selon la recherche textuelle
  const filteredBySearch = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return filteredByActions;
    }

    const query = searchQuery.toLowerCase().trim();
    return filteredByActions.filter((d) => {
      const titleMatch = d.title?.toLowerCase().includes(query) || false;
      const projectMatch = d.project?.name?.toLowerCase().includes(query) || false;
      return titleMatch || projectMatch;
    });
  }, [filteredByActions, searchQuery]);

  // Trier les décisions
  const sortedDecisions = useMemo(() => {
    const sorted = [...filteredBySearch];

    switch (sortBy) {
      case "priority":
        // Priorité : RED > YELLOW > GREEN, puis par nombre d'actions
        return sorted.sort((a, b) => {
          const riskOrder = { RED: 3, YELLOW: 2, GREEN: 1 };
          const riskDiff = riskOrder[b.meta.risk.level] - riskOrder[a.meta.risk.level];
          if (riskDiff !== 0) return riskDiff;
          return b.meta.actionCount - a.meta.actionCount;
        });

      case "urgency":
        // Urgence : en retard > échéance proche > sans échéance
        return sorted.sort((a, b) => {
          const aDue = a.meta.nextDueDate 
            ? (a.meta.nextDueDate instanceof Date ? a.meta.nextDueDate : new Date(a.meta.nextDueDate))
            : null;
          const bDue = b.meta.nextDueDate 
            ? (b.meta.nextDueDate instanceof Date ? b.meta.nextDueDate : new Date(b.meta.nextDueDate))
            : null;
          
          if (!aDue && !bDue) return 0;
          if (!aDue) return 1;
          if (!bDue) return -1;

          const aOverdue = isOverdue(aDue, "TODO", new Date());
          const bOverdue = isOverdue(bDue, "TODO", new Date());
          
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
          
          return aDue.getTime() - bDue.getTime();
        });

      case "date":
      default:
        // Date : plus récentes en premier
        return sorted.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
  }, [filteredBySearch, sortBy]);

  // Compter les décisions par catégorie
  const counts = useMemo(() => {
    const all = decisions.length;
    const monitoring = decisions.filter(
      (d) => (d.meta.risk.level === "RED" || d.meta.risk.level === "YELLOW") && d.status !== "ARCHIVED"
    ).length;
    const decided = decisions.filter((d) => d.status === "DECIDED").length;
    const archived = decisions.filter((d) => d.status === "ARCHIVED").length;

    return { all, monitoring, decided, archived };
  }, [decisions]);

  return (
    <div className="space-y-4">
      {/* Barre de contexte + Onglets sur une seule ligne */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <DecisionsContextBar decisions={decisions} />
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="bg-white border border-slate-200/80 w-max min-w-full sm:min-w-0 rounded-lg">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md"
              >
                Toutes {counts.all > 0 && <span className="ml-1.5">({counts.all})</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md"
              >
                À surveiller {counts.monitoring > 0 && <span className="ml-1.5">({counts.monitoring})</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="decided" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md"
              >
                Décidées {counts.decided > 0 && <span className="ml-1.5">({counts.decided})</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="archived" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md"
              >
                Archivées {counts.archived > 0 && <span className="ml-1.5">({counts.archived})</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Filtres - Une seule ligne */}
      <DecisionsFiltersEnhanced
        activeTab={activeTab}
        onTabChange={setActiveTab}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        counts={counts}
      />

      {/* Liste des décisions */}
      {sortedDecisions.length === 0 ? (
        <FlowCard variant="default" className="bg-white border border-slate-200/80">
          <FlowCardContent className="p-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Aucune décision trouvée
                </h3>
                <p className="text-sm text-slate-600">
                  Aucune décision ne correspond aux filtres sélectionnés.
                </p>
              </div>
            </div>
          </FlowCardContent>
        </FlowCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedDecisions.map((decision) => (
            <DecisionCardEnhanced
              key={decision.id}
              decision={decision}
              meta={decision.meta}
            />
          ))}
        </div>
      )}

      {/* Compteur de résultats */}
      {sortedDecisions.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          {sortedDecisions.length} décision{sortedDecisions.length > 1 ? "s" : ""} affichée{sortedDecisions.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

