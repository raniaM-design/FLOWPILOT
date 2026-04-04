"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateActionStatus } from "@/app/app/actions";
import { isOverdue } from "@/lib/timeUrgency";

type Status = "TODO" | "DOING" | "DONE" | "BLOCKED";

/** Aligné sur l’action rapide mobile : « Terminer » vs « Bloquer ». */
export function getMobilePriorityQuickKind(
  status: string,
  dueDate: Date | null,
): "termine" | "bloque" {
  if (status === "BLOCKED") return "termine";
  if (status !== "TODO" && status !== "DOING") return "termine";
  const overdue = isOverdue(dueDate, status as Status);
  if (overdue) return "termine";
  if (!dueDate) return "termine";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "termine";
  if (diffDays <= 7) return "bloque";
  return "termine";
}

export function DashboardPriorityQuickAction({
  actionId,
  status,
  dueDate,
}: {
  actionId: string;
  status: string;
  dueDate: Date | null;
}) {
  const router = useRouter();
  const t = useTranslations("actions");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const kind = getMobilePriorityQuickKind(status, dueDate);

  const handleDone = () => {
    startTransition(async () => {
      await updateActionStatus(actionId, "DONE");
      router.refresh();
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

  if (status === "DONE") return null;

  return (
    <>
      {kind === "termine" ? (
        <Button
          type="button"
          size="sm"
          className="h-auto min-h-0 min-w-[90px] shrink-0 rounded-[20px] px-4 py-2.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 touch-manipulation"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDone();
          }}
        >
          Terminer
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 px-4 py-3 text-xs font-semibold shrink-0 border-amber-300 text-amber-800 touch-manipulation"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setBlockOpen(true);
          }}
        >
          Bloquer
        </Button>
      )}

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("blockReasonDialogTitle")}</DialogTitle>
            <DialogDescription>{t("blockReasonDialogDescription")}</DialogDescription>
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
    </>
  );
}
