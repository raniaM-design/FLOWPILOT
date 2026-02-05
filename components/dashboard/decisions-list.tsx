"use client";

import { useState, useMemo } from "react";
import { DecisionCard, DecisionCardMeta } from "@/components/decisions/decision-card";
import { DecisionsPagination } from "./decisions-pagination";
import { useTranslations } from "next-intl";
import { useSearch } from "@/contexts/search-context";

interface DecisionWithMeta {
  decision: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    project: {
      id: string;
      name: string;
    };
    actions: Array<{
      id: string;
      status: string;
      dueDate: Date | null;
    }>;
  };
  meta: DecisionCardMeta;
}

interface DecisionsListProps {
  decisions: DecisionWithMeta[];
  itemsPerPage?: number;
}

export function DecisionsList({ decisions, itemsPerPage = 3 }: DecisionsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const t = useTranslations("dashboard");
  const { searchQuery } = useSearch();

  // Filtrer selon la recherche textuelle
  const filteredDecisions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return decisions;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = decisions.filter(({ decision }) => {
      const titleMatch = decision.title?.toLowerCase().includes(query) || false;
      const projectMatch = decision.project?.name?.toLowerCase().includes(query) || false;
      return titleMatch || projectMatch;
    });
    
    // Log pour déboguer
    if (searchQuery.trim()) {
      console.log("[DashboardDecisionsList] Recherche:", searchQuery, "- Résultats:", filtered.length, "/", decisions.length);
    }
    
    return filtered;
  }, [decisions, searchQuery]);

  const currentDecisions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDecisions.slice(startIndex, endIndex);
  }, [filteredDecisions, currentPage, itemsPerPage]);

  if (filteredDecisions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-normal text-text-secondary leading-relaxed">
          {searchQuery
            ? `Aucune décision ne correspond à "${searchQuery}".`
            : t("noDecisionsToMonitor")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {currentDecisions.map((item) => (
          <DecisionCard
            key={item.decision.id}
            decision={item.decision}
            meta={item.meta}
          />
        ))}
      </div>
      {filteredDecisions.length > itemsPerPage && (
        <DecisionsPagination
          totalItems={filteredDecisions.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

