"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { updateDecisionStatus, UpdateDecisionStatusResult } from "./actions";
import { useRouter } from "next/navigation";

interface MarkDecidedButtonProps {
  decisionId: string;
  onWarning?: (warning: UpdateDecisionStatusResult["warning"]) => void;
}

export function MarkDecidedButton({ decisionId, onWarning }: MarkDecidedButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result: UpdateDecisionStatusResult = await updateDecisionStatus(decisionId, "DECIDED");
      
      // Toujours rafraîchir car le changement est toujours autorisé
      router.refresh();
      
      // Notifier le parent du warning si présent
      if (result.warning && onWarning) {
        onWarning(result.warning);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <Button type="submit" size="sm" variant="default" disabled={isPending}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isPending ? "Enregistrement..." : "Marquer comme décidée"}
      </Button>
    </form>
  );
}

