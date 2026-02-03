"use client";

import { useState, useMemo } from "react";
import { DecisionCard, DecisionCardMeta } from "@/components/decisions/decision-card";
import { DecisionsPagination } from "./decisions-pagination";
import { useTranslations } from "next-intl";

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

  const currentDecisions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return decisions.slice(startIndex, endIndex);
  }, [decisions, currentPage, itemsPerPage]);

  if (decisions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-normal text-text-secondary leading-relaxed">
          {t("noDecisionsToMonitor")}
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
      {decisions.length > itemsPerPage && (
        <DecisionsPagination
          totalItems={decisions.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

