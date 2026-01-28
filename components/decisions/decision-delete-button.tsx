"use client";

import { DeleteButton } from "@/components/delete-button";

interface DecisionDeleteButtonProps {
  decisionId: string;
}

export function DecisionDeleteButton({ decisionId }: DecisionDeleteButtonProps) {
  return (
    <DeleteButton
      id={decisionId}
      type="decision"
      redirectTo="/app/decisions"
      variant="outline"
      size="sm"
    />
  );
}

