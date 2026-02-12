import { Chip } from "@/components/ui/chip";
import { DecisionRisk } from "@/lib/decision-risk";
import type { DeadlineDisplayState } from "@/components/decisions/decision-card";

interface DecisionRiskBadgeProps {
  risk: DecisionRisk;
  /** État basé sur l'échéance : critical=<3j, to_monitor=3-10j, ok=≥10j ou rien */
  deadlineDisplayState?: DeadlineDisplayState;
}

export function DecisionRiskBadge({ risk, deadlineDisplayState = "ok" }: DecisionRiskBadgeProps) {
  const getDisplayLabel = (): string => {
    switch (deadlineDisplayState) {
      case "critical":
        return "Critique";
      case "to_monitor":
        return "À surveiller";
      case "ok":
      default:
        return "Sous contrôle";
    }
  };

  const getVariant = (): "neutral" | "info" | "success" | "warning" | "danger" => {
    switch (deadlineDisplayState) {
      case "critical":
        return "danger";
      case "to_monitor":
        return "warning";
      case "ok":
      default:
        return "success";
    }
  };

  const getChipClassName = () => {
    switch (deadlineDisplayState) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200/60";
      case "to_monitor":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "ok":
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
  };

  return (
    <Chip variant={getVariant()} size="sm" className={getChipClassName()}>
      {getDisplayLabel()}
    </Chip>
  );
}
