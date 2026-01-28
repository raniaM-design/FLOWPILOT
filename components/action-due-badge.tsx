"use client";

import { Chip } from "@/components/ui/chip";
import { AlertCircle, Calendar } from "lucide-react";
import { DueMeta } from "@/lib/timeUrgency";

interface ActionDueBadgeProps {
  dueMeta: DueMeta;
  overdue: boolean;
}

/**
 * Composant Client Component pour afficher le badge d'échéance d'une action
 * Affiche un Chip "En retard" si overdue, sinon un Chip selon dueMeta.kind
 */
export function ActionDueBadge({ dueMeta, overdue }: ActionDueBadgeProps) {
  // Si en retard, afficher le chip rouge
  if (overdue) {
    return (
      <Chip variant="danger" size="sm" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        En retard
      </Chip>
    );
  }

  // Si pas d'échéance, ne rien afficher
  if (dueMeta.kind === "NONE") {
    return null;
  }

  // Chip selon le kind
  let variant: "neutral" | "info" | "success" | "warning" | "danger" = "neutral";
  let icon: React.ReactNode = null;

  switch (dueMeta.kind) {
    case "TODAY":
      variant = "warning";
      icon = <Calendar className="h-3 w-3" />;
      break;
    case "TOMORROW":
      variant = "info";
      icon = <Calendar className="h-3 w-3" />;
      break;
    case "SOON":
      variant = "info";
      icon = <Calendar className="h-3 w-3" />;
      break;
    case "THIS_WEEK":
      variant = "info";
      icon = <Calendar className="h-3 w-3" />;
      break;
    case "LATER":
      variant = "neutral";
      icon = <Calendar className="h-3 w-3" />;
      break;
    default:
      variant = "neutral";
  }

  return (
    <Chip variant={variant} size="sm" className="gap-1">
      {icon}
      {dueMeta.label}
    </Chip>
  );
}

