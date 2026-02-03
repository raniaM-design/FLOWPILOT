"use client";

import { useState } from "react";
import { ActionFormFields } from "./action-form-fields";
import { UserMentionInput } from "./mentions/user-mention-input";
import { Label } from "./ui/label";

interface ActionFormFieldsWithMentionsProps {
  decisionId?: string;
  titleInputId?: string;
  dueDateInputId?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Wrapper pour ActionFormFields qui ajoute le support des mentions
 */
export function ActionFormFieldsWithMentions({
  decisionId,
  titleInputId,
  dueDateInputId,
  onKeyDown,
}: ActionFormFieldsWithMentionsProps) {
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  // Ajouter un input caché pour transmettre les mentions au formulaire
  return (
    <>
      <ActionFormFields
        decisionId={decisionId}
        titleInputId={titleInputId}
        dueDateInputId={dueDateInputId}
        onKeyDown={onKeyDown}
      />
      <input
        type="hidden"
        name="mentionedUserIds"
        value={mentionedUserIds.join(",")}
      />
      <div className="space-y-2">
        <Label htmlFor="action-mentions">Mentionner des utilisateurs (optionnel)</Label>
        <UserMentionInput
          value={mentionedUserIds}
          onChange={setMentionedUserIds}
          placeholder="Tapez @email pour mentionner..."
        />
      </div>
    </>
  );
}

