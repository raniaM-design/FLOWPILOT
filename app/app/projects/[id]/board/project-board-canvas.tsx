"use client";

/**
 * ProjectBoardCanvas — zone du whiteboard avec bordure, coins arrondis, ombre
 */
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { TLStore } from "tldraw";
import type { Editor } from "tldraw";

const BoardCanvas = dynamic(
  () => import("./board-canvas").then((m) => m.BoardCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--brand))]" />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement du tableau...</p>
      </div>
    ),
  }
);

interface ProjectBoardCanvasProps {
  store: TLStore;
  onMount: (editor: Editor) => void | (() => void);
  projectId: string;
  isLoading?: boolean;
}

export function ProjectBoardCanvas({
  store,
  onMount,
  projectId,
  isLoading = false,
}: ProjectBoardCanvasProps) {
  return (
    <div className="h-full min-h-0 relative w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200/80 bg-white">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--brand))]" />
          </div>
          <p className="text-sm font-medium text-slate-500">Chargement du tableau...</p>
        </div>
      ) : (
        <BoardCanvas store={store} onMount={onMount} projectId={projectId} />
      )}
    </div>
  );
}
