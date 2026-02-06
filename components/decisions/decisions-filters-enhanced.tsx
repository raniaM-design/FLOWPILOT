"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";

export type SortOption = "date" | "priority" | "urgency";
export type ActionFilter = "all" | "with" | "without";

interface DecisionsFiltersEnhancedProps {
  activeTab: "all" | "monitoring" | "decided" | "archived";
  onTabChange: (tab: "all" | "monitoring" | "decided" | "archived") => void;
  riskFilter: string;
  onRiskFilterChange: (risk: string) => void;
  actionFilter: ActionFilter;
  onActionFilterChange: (filter: ActionFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    all: number;
    monitoring: number;
    decided: number;
    archived: number;
  };
}

export function DecisionsFiltersEnhanced({
  activeTab,
  onTabChange,
  riskFilter,
  onRiskFilterChange,
  actionFilter,
  onActionFilterChange,
  sortBy,
  onSortChange,
  counts,
}: DecisionsFiltersEnhancedProps) {
  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "date":
        return "Date";
      case "priority":
        return "Priorité";
      case "urgency":
        return "Urgence";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "all":
        return "Tous";
      case "RED":
        return "Critique";
      case "YELLOW":
        return "Attention";
      case "GREEN":
        return "OK";
      default:
        return "Tous";
    }
  };

  return (
    <div>
      {/* Filtres et tri - Une seule ligne */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filtre Risque - Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Risque: {getRiskLabel(riskFilter)}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onRiskFilterChange("all")}>
              Tous
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRiskFilterChange("RED")}>
              Critique
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRiskFilterChange("YELLOW")}>
              Attention
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRiskFilterChange("GREEN")}>
              OK
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtre Actions - Segmented */}
        <SegmentedControl
          options={[
            { value: "all", label: "Toutes" },
            { value: "with", label: "Avec" },
            { value: "without", label: "Sans" },
          ]}
          value={actionFilter}
          onChange={(value) => onActionFilterChange(value as ActionFilter)}
        />

        {/* Tri - Dropdown à droite */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                {getSortLabel(sortBy)}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange("date")}>
                Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("priority")}>
                Priorité
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange("urgency")}>
                Urgence
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

