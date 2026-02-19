"use client";

/**
 * Page Board — layout moderne, premium, cohérent avec Pilotys
 * Header clean + zone board dans une carte (rounded, shadow)
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTLStore,
  loadSnapshot,
  getSnapshot,
  type Editor,
  type TLStore,
} from "tldraw";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { ProjectNavigation } from "../project-navigation";
import { Button } from "@/components/ui/button";
import { ProjectBoardCanvas } from "./project-board-canvas";
import { toast } from "sonner";

interface ProjectBoardProps {
  projectId: string;
  projectName: string;
}

export function ProjectBoard({ projectId, projectName }: ProjectBoardProps) {
  const [store] = useState<TLStore>(() => createTLStore());
  const editorRef = useRef<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadBoard() {
      try {
        const res = await fetch(`/api/projects/${projectId}/board`);
        if (!res.ok) throw new Error("Erreur chargement");
        const json = await res.json();
        if (!cancelled && json.data) {
          loadSnapshot(store, { document: json.data });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[Board] Erreur chargement:", err);
          toast.error("Impossible de charger le board");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadBoard();
    return () => { cancelled = true; };
  }, [projectId, store]);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    return () => { editorRef.current = null; };
  }, []);

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) {
      toast.error("L'éditeur n'est pas prêt");
      return;
    }
    setIsSaving(true);
    try {
      const { document } = getSnapshot(editor.store);
      const res = await fetch(`/api/projects/${projectId}/board`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: document }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur sauvegarde");
      }
      toast.success("Board sauvegardé");
    } catch (err) {
      console.error("[Board] Erreur sauvegarde:", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  return (
    <div
      className="w-full flex flex-col bg-slate-100/60"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Header — titre, description, actions à droite */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-white border-b border-slate-200/80">
        <ProjectNavigation projectId={projectId} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {projectName}
            </h1>
            <p className="text-sm text-slate-500">
              Tableau blanc — post-its, texte, formes. Dessinez puis sauvegardez.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="gap-2 bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-sm"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 border-slate-200 hover:bg-slate-50"
            >
              <Link href={`/app/projects/${projectId}`}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Zone board — carte pleine hauteur, bordure, rounded, shadow-sm */}
      <div className="flex-1 min-h-0 p-4">
        <ProjectBoardCanvas
          store={store}
          onMount={handleMount}
          projectId={projectId}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
