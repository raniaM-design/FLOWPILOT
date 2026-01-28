"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useTranslations } from "next-intl";

interface DeleteButtonProps {
  id: string;
  type: "action" | "decision" | "meeting" | "project";
  redirectTo: string;
  onSuccess?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Composant bouton de suppression avec confirmation
 * Gère la logique de suppression, les toasts et les redirections
 */
export function DeleteButton({
  id,
  type,
  redirectTo,
  onSuccess,
  variant = "destructive",
  size = "default",
  className,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("delete");
  const tCommon = useTranslations("common");

  const getTitle = () => {
    switch (type) {
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
    switch (type) {
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
    switch (type) {
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
    switch (type) {
      case "action":
        return `/api/actions/${id}`;
      case "decision":
        return `/api/decisions/${id}`;
      case "meeting":
        return `/api/meetings/${id}`;
      case "project":
        return `/api/projects/${id}`;
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

        // Succès : rediriger et appeler le callback
        router.push(redirectTo);
        router.refresh();
        onSuccess?.();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        // TODO: Afficher un toast d'erreur
        alert(error instanceof Error ? error.message : tCommon("deleteError"));
      } finally {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {tCommon("delete")}
      </Button>

      <DeleteConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title={getTitle()}
        description={getDescription()}
        impactMessage={getImpactMessage()}
        isLoading={isPending}
      />
    </>
  );
}

