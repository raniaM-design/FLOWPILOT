"use client";

import { useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFocusModeEnabled } from "@/lib/user-preferences";
import { getDefaultDueDate } from "@/lib/utils/default-due-date";

interface ActionFormFieldsProps {
  decisionId?: string;
  titleInputId?: string;
  dueDateInputId?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Composant réutilisable pour les champs de formulaire d'action
 * Gère auto-focus, pré-remplissage dueDate selon focusMode, et Enter pour soumettre
 */
export function ActionFormFields({
  decisionId,
  titleInputId,
  dueDateInputId,
  onKeyDown,
}: ActionFormFieldsProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
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
    if (defaultDueDate) {
      // Trouver le formulaire parent
      const form = titleInputRef.current?.closest("form");
      if (form) {
        const dueDateInput = form.querySelector<HTMLInputElement>('input[name="dueDate"]');
        if (dueDateInput && !dueDateInput.value) {
          dueDateInput.value = defaultDueDate;
        }
      }
    }
  }, [defaultDueDate]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter pour soumettre le formulaire (sauf si Shift est pressé)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = titleInputRef.current?.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
    onKeyDown?.(e);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={titleInputId || `action-title-${decisionId || ""}`}>
          Titre de l'action *
        </Label>
        <Input
          ref={titleInputRef}
          id={titleInputId || `action-title-${decisionId || ""}`}
          name="title"
          placeholder="Ex: Mettre en place l'environnement de développement"
          required
          minLength={2}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={dueDateInputId || `action-dueDate-${decisionId || ""}`}>
          Date d'échéance{focusMode && defaultDueDate ? " (par défaut: dans 3 jours)" : ""}
        </Label>
        <Input
          id={dueDateInputId || `action-dueDate-${decisionId || ""}`}
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
    </>
  );
}

