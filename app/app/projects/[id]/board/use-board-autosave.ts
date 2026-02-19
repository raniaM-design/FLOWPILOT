"use client";

/**
 * useBoardAutosave — autosave du board toutes les 8s + debounce 1.5s après interaction
 * Retourne { status, lastSavedAt, save } pour le composant de statut
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "tldraw";
import { getSnapshot } from "tldraw";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseBoardAutosaveOptions {
  editor: Editor | null;
  projectId: string;
  onSaveSuccess?: () => void;
  onSaveError?: (err: Error) => void;
}

const AUTOSAVE_INTERVAL_MS = 8000;
const DEBOUNCE_MS = 1500;

export function useBoardAutosave({
  editor,
  projectId,
  onSaveSuccess,
  onSaveError,
}: UseBoardAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSnapshotRef = useRef<string>("");

  const save = useCallback(async () => {
    if (!editor) return;
    setStatus("saving");
    try {
      const { document } = getSnapshot(editor.store);
      const snapshotStr = JSON.stringify(document);
      if (snapshotStr === lastSnapshotRef.current) {
        setStatus("saved");
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/board`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: document }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur sauvegarde");
      }
      lastSnapshotRef.current = snapshotStr;
      setLastSavedAt(new Date());
      setStatus("saved");
      onSaveSuccess?.();
    } catch (err) {
      setStatus("error");
      onSaveError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [editor, projectId, onSaveSuccess, onSaveError]);

  useEffect(() => {
    if (!editor) return;

    const scheduleDebouncedSave = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        save();
      }, DEBOUNCE_MS);
    };

    const handleChange = () => {
      scheduleDebouncedSave();
    };

    const unlisten = editor.store.listen(
      () => {
        handleChange();
      },
      { source: "user", scope: "document" } as { source?: "user"; scope?: "document" }
    );

    intervalRef.current = setInterval(save, AUTOSAVE_INTERVAL_MS);

    return () => {
      unlisten?.();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [editor, save]);

  return { status, lastSavedAt, save };
}
