"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Decision {
  id: string;
  title: string;
  status: string;
  actions: Array<{
    id: string;
    status: string;
    dueDate: string | null;
  }>;
  meta: {
    risk: {
      level: "GREEN" | "YELLOW" | "RED";
    };
    actionCount: number;
    nextDueDate: Date | null;
  };
}

interface DecisionsContextBarProps {
  decisions: Decision[];
}

export function DecisionsContextBar({ decisions }: DecisionsContextBarProps) {
  const stats = useMemo(() => {
    const total = decisions.length;
    
    // Décisions en retard (avec échéance dépassée)
    const overdue = decisions.filter((d) => {
      if (!d.meta.nextDueDate) return false;
      const dueDate = d.meta.nextDueDate instanceof Date 
        ? d.meta.nextDueDate 
        : new Date(d.meta.nextDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && d.status !== "DONE";
    }).length;

    // Décisions à surveiller (risque YELLOW ou RED)
    const monitoring = decisions.filter(
      (d) => (d.meta.risk.level === "RED" || d.meta.risk.level === "YELLOW") && d.status !== "ARCHIVED"
    ).length;

    // Décisions décidées
    const decided = decisions.filter((d) => d.status === "DECIDED").length;

    // Décisions sans actions
    const withoutActions = decisions.filter((d) => d.meta.actionCount === 0 && d.status !== "ARCHIVED").length;

    return {
      total,
      overdue,
      monitoring,
      decided,
      withoutActions,
    };
  }, [decisions]);

  if (stats.total === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {stats.total > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/40 border border-blue-100/60">
          <span className="text-base font-semibold text-blue-600">{stats.total}</span>
          <span className="text-sm text-slate-600">décision{stats.total > 1 ? "s" : ""}</span>
        </div>
      )}
      
      {stats.monitoring > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50/40 border border-amber-100/60">
          <span className="text-base font-semibold text-amber-600">{stats.monitoring}</span>
          <span className="text-sm text-slate-600">à surveiller</span>
        </div>
      )}
      
      {stats.withoutActions > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50/40 border border-slate-200/60">
          <span className="text-base font-semibold text-slate-600">{stats.withoutActions}</span>
          <span className="text-sm text-slate-600">sans actions</span>
        </div>
      )}
    </div>
  );
}

