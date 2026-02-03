"use client";

import { useState, useTransition, useRef, useEffect, KeyboardEvent } from "react";
import { showActionCreatedToast } from "@/lib/toast-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Plus } from "lucide-react";
import { createActionForDecision, CreateActionForDecisionResult } from "./actions";
import { useRouter } from "next/navigation";
import { isFocusModeEnabled } from "@/lib/user-preferences";
import { getDefaultDueDate } from "@/lib/utils/default-due-date";
import { useTranslations } from "next-intl";

interface QuickAddActionProps {
  decisionId: string;
}

export function QuickAddAction({ decisionId }: QuickAddActionProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [warning, setWarning] = useState<CreateActionForDecisionResult["warning"] | null>(null);
  const focusMode = isFocusModeEnabled();
  const defaultDueDate = getDefaultDueDate(focusMode);
  const t = useTranslations("actions");

  // Auto-focus sur le champ title au montage
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  // Pré-remplir dueDate si focusMode est activé
  useEffect(() => {
    if (defaultDueDate && formRef.current) {
      const dueDateInput = formRef.current.querySelector<HTMLInputElement>('input[name="dueDate"]');
      if (dueDateInput && !dueDateInput.value) {
        dueDateInput.value = defaultDueDate;
      }
    }
  }, [defaultDueDate]);

  async function handleSubmit(formData: FormData) {
    formData.append("decisionId", decisionId);
    setWarning(null);
    
    startTransition(async () => {
      const result = await createActionForDecision(formData);
      
      // Reset le formulaire après création réussie
      formRef.current?.reset();
      
      // Réappliquer la date par défaut si focusMode
      if (defaultDueDate && formRef.current) {
        const dueDateInput = formRef.current.querySelector<HTMLInputElement>('input[name="dueDate"]');
        if (dueDateInput) {
          dueDateInput.value = defaultDueDate;
        }
      }
      
      // Re-focus sur le champ title
      titleInputRef.current?.focus();
      
      // Afficher le toast de succès avec un message adapté
      if (!result.warning) {
        if (result.actionLinked) {
          showActionCreatedToast(t("actionLinked"));
        } else {
          showActionCreatedToast(t("actionAdded"));
        }
      }
      
      // Refresh la page pour afficher la nouvelle action
      router.refresh();
      
      // Afficher le warning si présent
      if (result.warning) {
        setWarning(result.warning);
      }
    });
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter pour soumettre le formulaire (sauf si Shift est pressé)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <form ref={formRef} action={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            ref={titleInputRef}
            name="title"
            placeholder={`${t("actionTitlePlaceholder")} *`}
            required
            minLength={2}
            disabled={isPending}
            className="w-full"
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex-1">
          <Input
            name="dueDate"
            type="date"
            disabled={isPending}
            className="w-full"
            defaultValue={defaultDueDate || undefined}
            title={focusMode && defaultDueDate ? t("dueDateDefaultTooltip") : undefined}
          />
        </div>
        <Button type="submit" disabled={isPending} size="default" className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {isPending ? t("adding") : t("add")}
        </Button>
      </form>
      
      {warning === "MISSING_DUE_DATE" && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
            {t("missingDueDateWarningQuick")}
          </AlertDescription>
        </Alert>
      )}
      
      <p className="text-xs text-muted-foreground">
        {t("executableHint")}
      </p>
    </div>
  );
}

