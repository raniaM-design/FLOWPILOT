"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle, Circle, Ban, MoreVertical } from "lucide-react";
import { updateActionStatus } from "@/app/app/actions";
import { useRouter } from "next/navigation";
import { CelebrationFeedback } from "@/components/celebration-feedback";

interface ActionStatusControlProps {
  actionId: string;
  currentStatus: "TODO" | "DOING" | "DONE" | "BLOCKED";
}

export function ActionStatusControl({ actionId, currentStatus }: ActionStatusControlProps) {
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const [celebration, setCelebration] = useState<{
    message: string;
    nextStep?: string;
  } | null>(null);

  const handleStatusChange = (newStatus: "TODO" | "DOING" | "DONE" | "BLOCKED") => {
    startTransition(async () => {
      const result = await updateActionStatus(actionId, newStatus);
      setShowMenu(false);
      router.refresh();
      if (result.justCompleted) {
        setCelebration({
          message: "Bien joué ! Action terminée",
          nextStep: result.nextStep,
        });
      }
    });
  };

  // Bouton "Done" rapide si status != DONE
  if (currentStatus !== "DONE") {
    return (
      <>
        <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange("DONE")}
          disabled={isPending}
          className="h-7 text-xs"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {isPending ? "..." : "Done"}
        </Button>
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowMenu(!showMenu)}
            disabled={isPending}
            className="h-7 w-7 p-0"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 bg-popover border rounded-md shadow-md p-1 min-w-[140px]">
                <button
                  type="button"
                  onClick={() => handleStatusChange("TODO")}
                  disabled={isPending || currentStatus === "TODO"}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Circle className="h-3 w-3" />
                  À faire
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("DOING")}
                  disabled={isPending || currentStatus === "DOING"}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayCircle className="h-3 w-3" />
                  En cours
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange("BLOCKED")}
                  disabled={isPending || currentStatus === "BLOCKED"}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ban className="h-3 w-3" />
                  Bloquée
                </button>
              </div>
            </>
          )}
        </div>
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

  // Si DONE, afficher seulement le menu pour changer
  return (
    <>
      <div className="relative">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isPending}
        className="h-7 w-7 p-0"
      >
        <MoreVertical className="h-3 w-3" />
      </Button>
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-popover border rounded-md shadow-md p-1 min-w-[140px]">
            <button
              type="button"
              onClick={() => handleStatusChange("TODO")}
              disabled={isPending}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
            >
              <Circle className="h-3 w-3" />
              À faire
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("DOING")}
              disabled={isPending}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
            >
              <PlayCircle className="h-3 w-3" />
              En cours
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("BLOCKED")}
              disabled={isPending}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2"
            >
              <Ban className="h-3 w-3" />
              Bloquée
            </button>
          </div>
        </>
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

