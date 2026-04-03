"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createActionForDecision } from "@/app/app/decisions/[id]/actions";
import { getDefaultDueDate } from "@/lib/utils/default-due-date";
import { isFocusModeEnabled } from "@/lib/user-preferences";
import { Loader2, Plus } from "lucide-react";

export type StaleDecisionForModal = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
};

interface DecisionsStaleNoActionsBannerProps {
  staleCount: number;
  staleDecisions: StaleDecisionForModal[];
  assignOptions: { id: string; label: string }[];
  currentUserId: string;
}

export function DecisionsStaleNoActionsBanner({
  staleCount,
  staleDecisions,
  assignOptions,
  currentUserId,
}: DecisionsStaleNoActionsBannerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<StaleDecisionForModal[]>(staleDecisions);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const focusMode = isFocusModeEnabled();
  const defaultDue = getDefaultDueDate(focusMode) ?? "";

  const staleKey = staleDecisions.map((s) => s.id).join("|");
  useEffect(() => {
    setRows(staleDecisions);
  }, [staleKey]); // eslint-disable-line react-hooks/exhaustive-deps -- sync liste serveur

  if (staleCount <= 0) return null;

  function runCreate(decisionId: string, formData: FormData) {
    setPendingId(decisionId);
    startTransition(async () => {
      try {
        await createActionForDecision(formData);
        setRows((prev) => prev.filter((r) => r.id !== decisionId));
        router.refresh();
      } catch (e) {
        console.error(e);
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-medium leading-snug">
          ⚠️ {staleCount} décision{staleCount > 1 ? "s" : ""} sans actions depuis plus de 7 jours
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-300 bg-white hover:bg-amber-100 shrink-0"
          onClick={() => setOpen(true)}
        >
          Créer les actions manquantes
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Actions à créer</DialogTitle>
            <DialogDescription>
              Une ligne par décision : titre de l&apos;action, personne assignée et échéance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Toutes les actions demandées ont été ajoutées. Fermez la fenêtre ou actualisez la page.
              </p>
            ) : (
              rows.map((d) => (
                <form
                  key={d.id}
                  action={(fd) => runCreate(d.id, fd)}
                  className="flex flex-col lg:flex-row lg:items-end gap-2 p-3 rounded-lg border bg-slate-50/80"
                >
                  <input type="hidden" name="decisionId" value={d.id} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-medium text-slate-500 truncate" title={d.projectName}>
                      {d.projectName}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-1" title={d.title}>
                      {d.title}
                    </p>
                    <Input
                      name="title"
                      placeholder="Titre de l'action *"
                      required
                      minLength={2}
                      disabled={pendingId === d.id}
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 lg:w-auto w-full">
                    <select
                      name="assigneeId"
                      defaultValue={currentUserId}
                      disabled={pendingId === d.id}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm min-w-[140px] lg:w-[160px]"
                    >
                      {assignOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      name="dueDate"
                      type="date"
                      defaultValue={defaultDue}
                      disabled={pendingId === d.id}
                      className="h-9 w-full sm:w-[140px]"
                    />
                    <Button type="submit" size="sm" disabled={pendingId === d.id} className="h-9 shrink-0">
                      {pendingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
