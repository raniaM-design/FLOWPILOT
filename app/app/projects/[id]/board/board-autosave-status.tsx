"use client";

/**
 * BoardAutosaveStatus — statut en haut à droite du canvas
 * "Sauvegarde…" | "Enregistré il y a X sec" | "Erreur"
 */
import { useEditor } from "tldraw";
import { useBoardAutosave } from "./use-board-autosave";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface BoardAutosaveStatusProps {
  projectId: string;
}

function formatAgo(ms: number): string {
  if (ms < 1000) return "à l'instant";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `il y a ${sec} sec`;
  const min = Math.floor(sec / 60);
  return `il y a ${min} min`;
}

export function BoardAutosaveStatus({ projectId }: BoardAutosaveStatusProps) {
  const editor = useEditor();
  const { status, lastSavedAt } = useBoardAutosave({
    editor,
    projectId,
  });
  const [ago, setAgo] = useState("");

  useEffect(() => {
    if (status !== "saved" || !lastSavedAt) return;
    const update = () => {
      setAgo(formatAgo(Date.now() - lastSavedAt.getTime()));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [status, lastSavedAt]);

  if (status === "idle" && !lastSavedAt) return null;

  return (
    <div
      className="absolute top-3 right-3 z-[200] flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm border border-slate-200/80 bg-white/90"
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
          <span className="text-slate-600">Sauvegarde…</span>
        </>
      )}
      {status === "saved" && lastSavedAt && (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-slate-600">Enregistré {ago}</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-amber-700">Erreur de sauvegarde</span>
        </>
      )}
    </div>
  );
}
