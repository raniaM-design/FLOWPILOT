import { Chip } from "@/components/ui/chip";
import { DecisionRisk } from "@/lib/decision-risk";

interface DecisionRiskBadgeProps {
  risk: DecisionRisk;
}

export function DecisionRiskBadge({ risk }: DecisionRiskBadgeProps) {
  const getVariant = (): "neutral" | "info" | "success" | "warning" | "danger" => {
    switch (risk.level) {
      case "RED":
        return "danger";
      case "YELLOW":
        return "warning";
      case "GREEN":
        return "success";
      default:
        return "neutral";
    }
  };

  const getChipClassName = () => {
    switch (risk.level) {
      case "RED":
        return "bg-red-50 text-red-700 border-red-200/60";
      case "YELLOW":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "GREEN":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      default:
        return "";
    }
  };

  return (
    <Chip variant={getVariant()} size="sm" className={getChipClassName()}>
      {risk.label}
    </Chip>
  );
}
