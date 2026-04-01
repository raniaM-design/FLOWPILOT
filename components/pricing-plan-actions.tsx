"use client";

import UpgradeButton from "@/components/UpgradeButton";
import type { PlanKey } from "@/lib/stripe";

type Props = {
  highlightCard: boolean;
  monthlyKey: PlanKey;
  annualKey: PlanKey;
  monthlyLabel: string;
  annualLabel: string;
};

export function PricingPlanActions({
  highlightCard,
  monthlyKey,
  annualKey,
  monthlyLabel,
  annualLabel,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-2">
      <UpgradeButton
        planKey={monthlyKey}
        label={monthlyLabel}
        variant="primary"
        highlightCard={highlightCard}
      />
      <UpgradeButton
        planKey={annualKey}
        label={annualLabel}
        variant="outline"
        highlightCard={highlightCard}
      />
    </div>
  );
}
