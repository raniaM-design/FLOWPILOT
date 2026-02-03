"use client";

import { useState, useTransition, useEffect, useRef, KeyboardEvent } from "react";
import { showActionCreatedToast } from "@/lib/toast-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X, Info } from "lucide-react";
import { createActionForDecision, CreateActionForDecisionResult } from "./actions";
import { useRouter } from "next/navigation";
import { isFocusModeEnabled } from "@/lib/user-preferences";
import { getDefaultDueDate } from "@/lib/utils/default-due-date";
import { useTranslations } from "next-intl";

interface DecisionActionFormProps {
  decisionId: string;
}

export function DecisionActionForm({ decisionId }: DecisionActionFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [warning, setWarning] = useState<CreateActionForDecisionResult["warning"] | null>(null);
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusMode = isFocusModeEnabled();
  const defaultDueDate = getDefaultDueDate(focusMode);
  const t = useTranslations("actions");
  const tCommon = useTranslations("common");

  // Auto-focus sur le champ title quand le formulaire s'affiche
  useEffect(() => {
    if (showForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showForm]);

  // Pré-remplir dueDate si focusMode est activé
  useEffect(() => {
    if (showForm && defaultDueDate && formRef.current) {
      const dueDateInput = formRef.current.querySelector<HTMLInputElement>('input[name="dueDate"]');
      if (dueDateInput && !dueDateInput.value) {
        dueDateInput.value = defaultDueDate;
      }
    }
  }, [showForm, defaultDueDate]);

  async function handleSubmit(formData: FormData) {
    formData.append("decisionId", decisionId);
    setWarning(null); // Clear previous warnings
    startTransition(async () => {
      const result: CreateActionForDecisionResult = await createActionForDecision(formData);
      setShowForm(false);
      
      // Afficher le toast de succès avec un message adapté
      if (!result.warning) {
        if (result.actionLinked) {
          showActionCreatedToast(t("actionLinked"));
        } else {
          showActionCreatedToast(t("actionAdded"));
        }
      }
      
      router.refresh();
      
      // Afficher le warning si présent
      if (result.warning) {
        setWarning(result.warning);
        // Réafficher le formulaire pour montrer le warning
        setTimeout(() => {
          setShowForm(true);
        }, 100);
      }
    });
  }

  if (!showForm) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowForm(true)}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addAction")}
      </Button>
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter pour soumettre le formulaire (sauf si Shift est pressé)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} id="new-action-form" action={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{t("newAction")}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="action-title">{t("actionTitle")} *</Label>
        <Input
          ref={titleInputRef}
          id="action-title"
          name="title"
          placeholder={t("actionTitlePlaceholder")}
          required
          minLength={2}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="action-dueDate">
          {focusMode && defaultDueDate ? t("dueDateDefault") : t("dueDateOptional")}
        </Label>
        <Input
          id="action-dueDate"
          name="dueDate"
          type="date"
          className="w-full"
          defaultValue={defaultDueDate || undefined}
        />
        <p className="text-xs text-muted-foreground">
          {focusMode && defaultDueDate ? t("dueDateHelperFocus") : t("dueDateHelper")}
        </p>
      </div>
      
      {warning === "MISSING_DUE_DATE" && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
            {t("missingDueDateWarning")}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("creating") : t("createAction")}
        </Button>
      </div>
    </form>
  );
}

