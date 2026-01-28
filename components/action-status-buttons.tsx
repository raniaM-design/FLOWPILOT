"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, ArrowRight, Ban, MoreVertical } from "lucide-react";
import { updateActionStatus, advanceActionStatus } from "@/app/app/actions";
import { useRouter } from "next/navigation";
import { CelebrationFeedback } from "@/components/celebration-feedback";
import { useTranslations } from "next-intl";

interface ActionStatusButtonsProps {
  actionId: string;
  currentStatus: "TODO" | "DOING" | "DONE" | "BLOCKED";
}

export function ActionStatusButtons({ actionId, currentStatus }: ActionStatusButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("actions");
  const tStatus = useTranslations("status");
  const [celebration, setCelebration] = useState<{
    message: string;
    nextStep?: string;
  } | null>(null);

  const handleDone = () => {
    startTransition(async () => {
      const result = await updateActionStatus(actionId, "DONE");
      router.refresh();
      if (result.justCompleted) {
        // Message selon le contexte
        let message = "Bien joué.";
        if (result.hasNoOverdueActions) {
          message = "Plus aucun retard. Tu es clean.";
        }
        
        setCelebration({
          message,
          nextStep: result.nextStep,
        });
      }
    });
  };

  const handleAdvance = () => {
    startTransition(async () => {
      const result = await advanceActionStatus(actionId);
      router.refresh();
      if (result.justCompleted) {
        // Message selon le contexte
        let message = "Bien joué.";
        if (result.hasNoOverdueActions) {
          message = "Plus aucun retard. Tu es clean.";
        }
        
        setCelebration({
          message,
          nextStep: result.nextStep,
        });
      }
    });
  };

  const handleBlocked = () => {
    startTransition(async () => {
      await updateActionStatus(actionId, "BLOCKED");
      router.refresh();
    });
  };

  // Si status = DONE, désactiver tous les boutons
  const isDone = currentStatus === "DONE";
  const isTodo = currentStatus === "TODO";
  const isDoing = currentStatus === "DOING";
  const isBlocked = currentStatus === "BLOCKED";

  // Actions rapides visibles : Done et Bloqué
  const showDoneButton = (isTodo || isDoing) && !isDone;
  const showBlockedButton = !isBlocked && !isDone;
  
  // Actions dans le menu : Avancer (si TODO)
  const showAdvanceInMenu = isTodo && !isDone;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Bouton Done - Plus accessible (taille normale, visible) */}
        {showDoneButton && (
          <Button
            type="button"
            size="default"
            variant="default"
            onClick={handleDone}
            disabled={isPending}
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
            title={tStatus("done")}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {tStatus("done")}
          </Button>
        )}
        
        {/* Bouton Bloqué - Visible si pas déjà bloqué */}
        {showBlockedButton && (
          <Button
            type="button"
            size="default"
            variant="outline"
            onClick={handleBlocked}
            disabled={isPending}
            className="h-8 px-3 text-sm"
            title={t("block")}
          >
            <Ban className="h-4 w-4 mr-1.5" />
            {t("block")}
          </Button>
        )}

        {/* Menu "..." pour les actions supplémentaires */}
        {(showAdvanceInMenu || isDone) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="default"
                className="h-8 w-8 p-0"
                disabled={isPending}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{t("title")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showAdvanceInMenu && (
                <DropdownMenuItem
                  onClick={handleAdvance}
                  disabled={isPending}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {tStatus("doing")}
                </DropdownMenuItem>
              )}
              {isDone && (
                <DropdownMenuItem disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {tStatus("done")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {celebration && (
        <CelebrationFeedback
          message={celebration.message}
          nextStep={celebration.nextStep}
          onClose={() => setCelebration(null)}
        />
      )}
    </>
  );
}

