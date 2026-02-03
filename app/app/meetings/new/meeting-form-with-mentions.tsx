"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { UserMentionInput } from "@/components/mentions/user-mention-input";

export function MeetingFormWithMentions() {
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  return (
    <>
      <input
        type="hidden"
        name="mentionedUserIds"
        value={mentionedUserIds.join(",")}
      />
      <div className="space-y-2 mt-4">
        <Label htmlFor="meeting-mentions" className="text-sm text-muted-foreground">
          Mentionner des utilisateurs <span className="text-xs">(optionnel)</span>
        </Label>
        <UserMentionInput
          value={mentionedUserIds}
          onChange={setMentionedUserIds}
          placeholder="Tapez @email pour mentionner..."
        />
      </div>
    </>
  );
}

