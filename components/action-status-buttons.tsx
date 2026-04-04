"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowRight, Ban, MoreVertical } from "lucide-react";
import { updateActionStatus, advanceActionStatus } from "@/app/app/actions";
import { useRouter } from "next/navigation";
import { CelebrationFeedback } from "@/components/celebration-feedback";
import { useTranslations } from "next-intl";

interface ActionStatusButtonsProps {
  actionId: string;
  currentStatus: "TODO" | "DOING" | "DONE" | "BLOCKED";
}

export function ActionStatusButtons({
  actionId,
  currentStatus,
}: ActionStatusButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("actions");
  const tStatus = useTranslations("status");
  const tDashboard = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [celebration, setCelebration] = useState<{
    message: string;
    nextStep?: string;
  } | null>(null);

  const handleDone = () => {
    startTransition(async () => {
      const result = await updateActionStatus(actionId, "DONE");
      router.refresh();
      if (result.justCompleted) {
        let message = tDashboard("wellDone");
        if (result.hasNoOverdueActions) {
          message = tDashboard("noMoreOverdue");
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
        let message = tDashboard("wellDone");
        if (result.hasNoOverdueActions) {
          message = tDashboard("noMoreOverdue");
        }

        setCelebration({
          message,
          nextStep: result.nextStep,
        });
      }
    });
  };

  const submitBlocked = () => {
    startTransition(async () => {
      await updateActionStatus(actionId, "BLOCKED", {
        blockReason: blockReason.trim() || null,
      });
      setBlockOpen(false);
      setBlockReason("");
      router.refresh();
    });
  };

  const isDone = currentStatus === "DONE";
  const isTodo = currentStatus === "TODO";
  const isDoing = currentStatus === "DOING";
  const isBlocked = currentStatus === "BLOCKED";

  const showDoneButton = (isTodo || isDoing) && !isDone;
  const showBlockedButton = !isBlocked && !isDone;

  const showAdvanceInMenu = isTodo && !isDone;

  return (
    <>
      <div className="flex items-center gap-2">
        {showDoneButton && (
          <Button
            type="button"
            size="default"
            variant="default"
            onClick={handleDone}
            disabled={isPending}
            className="min-h-11 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium touch-manipulation max-md:min-w-0"
            title={tStatus("done")}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {tStatus("done")}
          </Button>
        )}

        {showBlockedButton && (
          <Button
            type="button"
            size="default"
            variant="outline"
            onClick={() => setBlockOpen(true)}
            disabled={isPending}
            className="min-h-11 px-4 py-3 text-sm touch-manipulation max-md:min-w-0"
            title={t("block")}
          >
            <Ban className="h-4 w-4 mr-1.5" />
            {t("block")}
          </Button>
        )}

        {(showAdvanceInMenu || isDone) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="default"
                className="h-8 w-8 min-h-11 min-w-11 p-0 md:min-h-8 md:min-w-8 touch-manipulation"
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

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("blockReasonDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("blockReasonDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder={t("blockReasonPlaceholder")}
            className="min-h-[88px] resize-y"
            disabled={isPending}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={submitBlocked}
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t("blockConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
