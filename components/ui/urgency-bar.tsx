"use client";

import { cn } from "@/lib/utils";

export interface UrgencyBarProps {
  done: number;
  open: number;
  overdue: number;
  blocked: number;
  showLegend?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Composant générique pour afficher une barre d'urgence avec segments proportionnels
 * Utilisable pour décisions, projets, ou tout autre contexte nécessitant une visualisation d'état
 */
export function UrgencyBar({
  done,
  open,
  overdue,
  blocked,
  showLegend = true,
  className,
  size = "md",
}: UrgencyBarProps) {
  const total = done + open + overdue + blocked;

  // Si aucun élément, ne rien afficher
  if (total === 0) {
    return null;
  }

  // Calculer les pourcentages (minimum 2px pour visibilité)
  const donePercent = total > 0 ? Math.max((done / total) * 100, done > 0 ? 2 : 0) : 0;
  const openPercent = total > 0 ? Math.max((open / total) * 100, open > 0 ? 2 : 0) : 0;
  const overduePercent = total > 0 ? Math.max((overdue / total) * 100, overdue > 0 ? 2 : 0) : 0;
  const blockedPercent = total > 0 ? Math.max((blocked / total) * 100, blocked > 0 ? 2 : 0) : 0;

  // Construire la légende
  const legendParts: string[] = [];
  if (done > 0) legendParts.push(`${done} terminé${done > 1 ? "s" : ""}`);
  if (open > 0) legendParts.push(`${open} ouvert${open > 1 ? "s" : ""}`);
  if (overdue > 0) legendParts.push(`${overdue} en retard`);
  if (blocked > 0) legendParts.push(`${blocked} bloqué${blocked > 1 ? "s" : ""}`);

  const heightStyles = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-2.5",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Barre horizontale */}
      <div
        className={cn(
          "flex-1 rounded-full overflow-hidden flex bg-muted/50",
          heightStyles[size]
        )}
      >
        {done > 0 && (
          <div
            className="bg-muted-foreground/60 dark:bg-muted-foreground/40 transition-all duration-300"
            style={{ width: `${donePercent}%` }}
            title={`${done} terminé${done > 1 ? "s" : ""}`}
          />
        )}
        {open > 0 && (
          <div
            className="bg-blue-500 dark:bg-blue-600 transition-all duration-300"
            style={{ width: `${openPercent}%` }}
            title={`${open} ouvert${open > 1 ? "s" : ""}`}
          />
        )}
        {overdue > 0 && (
          <div
            className="bg-red-500 dark:bg-red-600 transition-all duration-300"
            style={{ width: `${overduePercent}%` }}
            title={`${overdue} en retard`}
          />
        )}
        {blocked > 0 && (
          <div
            className="bg-amber-500 dark:bg-amber-600 transition-all duration-300"
            style={{ width: `${blockedPercent}%` }}
            title={`${blocked} bloqué${blocked > 1 ? "s" : ""}`}
          />
        )}
      </div>

      {/* Légende */}
      {showLegend && legendParts.length > 0 && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {legendParts.join(" • ")}
        </span>
      )}
    </div>
  );
}

