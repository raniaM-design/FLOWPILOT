"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useTranslations } from "next-intl";

interface DeleteEntityDialogProps {
  entityType: "action" | "decision" | "meeting" | "project";
  entityId: string;
  entityLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  redirectTo?: string;
  impactText?: string;
}

/**
 * Composant réutilisable pour supprimer une entité avec confirmation
 * Gère l'appel API, les toasts, et la redirection
 */
export function DeleteEntityDialog({
  entityType,
  entityId,
  entityLabel,
  open,
  onOpenChange,
  onDeleted,
  redirectTo,
  impactText,
}: DeleteEntityDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("delete");
  const tCommon = useTranslations("common");

  const getTitle = () => {
    switch (entityType) {
      case "action":
        return t("actionTitle");
      case "decision":
        return t("decisionTitle");
      case "meeting":
        return t("meetingTitle");
      case "project":
        return t("projectTitle");
    }
  };

  const getDescription = () => {
    switch (entityType) {
      case "action":
        return t("actionDescription");
      case "decision":
        return t("decisionDescription");
      case "meeting":
        return t("meetingDescription");
      case "project":
        return t("projectDescription");
    }
  };

  const getImpactMessage = () => {
    if (impactText) {
      return impactText;
    }
    switch (entityType) {
      case "decision":
        return t("decisionImpact");
      case "meeting":
        return t("meetingImpact");
      case "project":
        return t("projectImpact");
      default:
        return undefined;
    }
  };

  const getApiEndpoint = () => {
    switch (entityType) {
      case "action":
        return `/api/actions/${entityId}`;
      case "decision":
        return `/api/decisions/${entityId}`;
      case "meeting":
        return `/api/meetings/${entityId}`;
      case "project":
        return `/api/projects/${entityId}`;
    }
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(getApiEndpoint(), {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || tCommon("deleteError"));
        }

        // Succès : fermer le dialog
        onOpenChange(false);

        // Rediriger si redirectTo est fourni
        if (redirectTo) {
          router.push(redirectTo);
          router.refresh();
        } else {
          // Sinon, rafraîchir et appeler le callback
          router.refresh();
          onDeleted?.();
        }

        // TODO: Afficher un toast de succès
        // toast.success(tCommon("deleteSuccess"));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        // TODO: Afficher un toast d'erreur
        alert(error instanceof Error ? error.message : tCommon("deleteError"));
      }
    });
  };

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      title={getTitle()}
      description={getDescription()}
      impactMessage={getImpactMessage()}
      isLoading={isPending}
    />
  );
}

