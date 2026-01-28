"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";
import { UpdateDecisionStatusResult } from "./actions";
import { useRouter } from "next/navigation";

interface DecisionWarningAlertProps {
  warning: UpdateDecisionStatusResult["warning"];
  decisionId: string;
  onDismiss?: () => void;
}

export function DecisionWarningAlert({
  warning,
  decisionId,
  onDismiss,
}: DecisionWarningAlertProps) {
  if (!warning || warning.code !== "DECISION_NOT_EXECUTABLE") {
    return null;
  }

  const handleAddAction = () => {
    // Scroll vers le formulaire d'ajout d'action
    const actionForm = document.getElementById("new-action-form");
    if (actionForm) {
      actionForm.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus sur le premier input si possible
      setTimeout(() => {
        const input = actionForm.querySelector("input");
        if (input) {
          input.focus();
        }
      }, 300);
    }
  };

  const handleContinue = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Décision enregistrée, mais non exécutable
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        <p className="mb-3 text-sm">
          Cette décision est bien enregistrée, mais elle ne produira aucun effet sans action concrète.
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4 text-sm">
          {warning.reasons.includes("NO_ACTION") && (
            <li>Aucune action liée à cette décision</li>
          )}
          {warning.reasons.includes("MISSING_DUE_DATE") && (
            <li>Certaines actions n'ont pas d'échéance</li>
          )}
        </ul>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={handleAddAction}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Plus className="mr-2 h-3 w-3" />
            Ajouter une action
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleContinue}
            className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          >
            Continuer quand même
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

