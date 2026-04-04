"use client";

import Link from "next/link";
import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateActionStatus } from "@/app/app/actions";
import { SwipeRevealRow } from "@/components/ui/swipe-reveal-row";
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
import { formatShortDate } from "@/lib/timeUrgency";
import { cn } from "@/lib/utils";

export type ActionMobileRowModel = {
  id: string;
  title: string;
  status: string;
  project: { id: string; name: string };
  dueDate: string | null;
  overdue: boolean;
  dueMeta: { label: string; color: string };
};

export function ActionMobileRow({ action }: { action: ActionMobileRowModel }) {
  const router = useRouter();
  const t = useTranslations("actions");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [doneVisual, setDoneVisual] = useState(action.status === "DONE");
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const isDone = action.status === "DONE" || doneVisual;

  const dueColor =
    action.overdue && action.status !== "DONE"
      ? "#B91C1C"
      : action.dueMeta?.color ?? "#667085";

  const toggleDone = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (action.status === "DONE" || isPending) return;
    setDoneVisual(true);
    startTransition(async () => {
      try {
        await updateActionStatus(action.id, "DONE");
        router.refresh();
      } catch {
        setDoneVisual(false);
        toast.error("Impossible de marquer comme terminée");
      }
    });
  };

  const submitBlocked = () => {
    startTransition(async () => {
      try {
        await updateActionStatus(action.id, "BLOCKED", {
          blockReason: blockReason.trim() || null,
        });
        setBlockOpen(false);
        setBlockReason("");
        router.refresh();
      } catch {
        toast.error("Impossible de bloquer");
      }
    });
  };

  const rowInner = (
    <div className="flex items-center gap-3 h-14 px-3 border border-[#E5E7EB] rounded-xl bg-white">
      <button
        type="button"
        onClick={toggleDone}
        disabled={action.status === "DONE" || isPending}
        className={cn(
          "h-9 w-9 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300",
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white scale-95"
            : "border-[#CBD5E1] bg-white",
        )}
        aria-label={t("ariaMarkDone")}
      >
        {isDone ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>
      <Link
        href={`/app/projects/${action.project.id}/kanban?actionId=${action.id}`}
        className="flex-1 min-w-0 flex items-center justify-between gap-2"
      >
        <span
          className={cn(
            "text-sm font-semibold text-[#111111] truncate transition-all duration-300",
            isDone && "line-through text-emerald-700",
          )}
        >
          {action.title}
        </span>
        {action.dueDate && (
          <span
            className="text-xs font-semibold tabular-nums flex-shrink-0"
            style={{ color: isDone ? "#16A34A" : dueColor }}
          >
            {formatShortDate(new Date(action.dueDate))}
          </span>
        )}
      </Link>
    </div>
  );

  if (action.status === "DONE") {
    return <div className="md:hidden">{rowInner}</div>;
  }

  const swipeActions =
    action.status === "BLOCKED"
      ? [
          {
            label: t("reassign"),
            className: "bg-slate-500",
            onClick: () =>
              router.push(
                `/app/projects/${action.project.id}/kanban?actionId=${action.id}`,
              ),
          },
        ]
      : [
          {
            label: t("block"),
            className: "bg-amber-600",
            onClick: () => setBlockOpen(true),
          },
          {
            label: t("reassign"),
            className: "bg-slate-500",
            onClick: () =>
              router.push(
                `/app/projects/${action.project.id}/kanban?actionId=${action.id}`,
              ),
          },
        ];

  return (
    <div className="md:hidden">
      <SwipeRevealRow contentClassName="bg-white" actions={swipeActions}>
        {rowInner}
      </SwipeRevealRow>

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
    </div>
  );
}
