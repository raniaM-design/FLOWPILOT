"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface Decision {
  id: string;
  title: string;
  displayState?: "critical" | "to_monitor" | "ok";
}

interface DecisionsSectionProps {
  decisions: Decision[];
}

/**
 * Section Décisions - Maximum 1-2 décisions importantes
 */
export function DecisionsSection({ decisions }: DecisionsSectionProps) {
  if (decisions.length === 0) {
    return null;
  }

  const displayDecisions = decisions.slice(0, 2);

  return (
    <div className="bg-amber-50 rounded-lg shadow-sm">
      <div className="p-5 border-b border-amber-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Décisions importantes</h2>
          <p className="text-sm text-slate-600 mt-1">Nécessitent votre attention</p>
        </div>
        {decisions.length > 2 && (
          <Link
            href="/app/decisions/risk"
            className="text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-amber-100">
        {displayDecisions.map((decision) => (
          <Link
            key={decision.id}
            href={`/app/decisions/${decision.id}`}
            className="block p-4 hover:bg-amber-100/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-slate-900">
                    {decision.title}
                  </h3>
                  {decision.displayState === "critical" && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      Critique
                    </span>
                  )}
                  {decision.displayState === "to_monitor" && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-semibold">
                      À surveiller
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

