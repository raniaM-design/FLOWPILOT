"use client";

import { useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFocusModeEnabled } from "@/lib/user-preferences";
import { getDefaultDueDate } from "@/lib/utils/default-due-date";
import { useRouter } from "next/navigation";

interface ActionFormProps {
  projectId?: string;
  decisionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  titleInputId?: string;
  dueDateInputId?: string;
}

/**
 * Composant réutilisable pour créer une action
 * Supporte la création depuis un projet ou une décision
 */
export function ActionForm({
  projectId,
  decisionId,
  onSuccess,
  onCancel,
  titleInputId,
  dueDateInputId,
}: ActionFormProps) {
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusMode = isFocusModeEnabled();
  const defaultDueDate = getDefaultDueDate(focusMode);

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

  const handleSubmit = async (formData: FormData) => {
    // Les Server Actions seront appelées directement via le form action
    // Cette fonction ne sera utilisée que si onSubmit est appelé manuellement
    onSuccess?.();
    router.refresh();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter pour soumettre le formulaire (sauf si Shift est pressé)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      {decisionId && <input type="hidden" name="decisionId" value={decisionId} />}
      
      <div className="space-y-2">
        <Label htmlFor={titleInputId || "action-title"}>Titre de l'action *</Label>
        <Input
          ref={titleInputRef}
          id={titleInputId || "action-title"}
          name="title"
          placeholder="Ex: Mettre en place l'environnement de développement"
          required
          minLength={2}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={dueDateInputId || "action-dueDate"}>
          Date d'échéance{focusMode && defaultDueDate ? " (par défaut: dans 3 jours)" : ""}
        </Label>
        <Input
          id={dueDateInputId || "action-dueDate"}
          name="dueDate"
          type="date"
          defaultValue={defaultDueDate || undefined}
        />
        <p className="text-xs text-muted-foreground">
          {focusMode && defaultDueDate
            ? "Date limite pour réaliser cette action (modifiable)"
            : "Date limite pour réaliser cette action"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Ajouter l'action
        </Button>
        {onCancel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}

