"use client";

import { useState, useCallback } from "react";
import { InviteCollaborator } from "./invite-collaborator";
import { CollaboratorsList } from "./collaborators-list";

interface CollaborationSectionProps {
  entityType: "action" | "decision" | "meeting";
  entityId: string;
}

export function CollaborationSection({ entityType, entityId }: CollaborationSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInviteSuccess = useCallback(() => {
    // Forcer le rechargement de la liste des collaborateurs
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <InviteCollaborator 
        entityType={entityType} 
        entityId={entityId}
        onInviteSuccess={handleInviteSuccess}
      />
      <CollaboratorsList 
        key={refreshKey}
        entityType={entityType} 
        entityId={entityId}
      />
    </div>
  );
}
