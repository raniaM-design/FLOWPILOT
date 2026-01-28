"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DeleteEntityDialog } from "./delete-entity-dialog";
import { useTranslations } from "next-intl";

interface EntityActionsMenuProps {
  entityType: "action" | "decision" | "meeting" | "project";
  entityId: string;
  entityLabel: string;
  onDeleted?: () => void;
  redirectTo?: string;
  impactText?: string;
  showEdit?: boolean;
  onEdit?: () => void;
  variant?: "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

/**
 * Menu d'actions réutilisable pour les entités (Actions, Décisions, Réunions, Projets)
 * Affiche un menu "⋯" avec options Modifier (optionnel) et Supprimer
 */
export function EntityActionsMenu({
  entityType,
  entityId,
  entityLabel,
  onDeleted,
  redirectTo,
  impactText,
  showEdit = false,
  onEdit,
  variant = "ghost",
  size = "icon",
}: EntityActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const t = useTranslations("common");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showEdit && onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              {t("edit")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteEntityDialog
        entityType={entityType}
        entityId={entityId}
        entityLabel={entityLabel}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onDeleted}
        redirectTo={redirectTo}
        impactText={impactText}
      />
    </>
  );
}

