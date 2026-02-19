"use client";

/**
 * Canvas tldraw — chargé uniquement côté client (ssr: false)
 * hideUi : masque l'UI native — on utilise notre BoardToolbar
 * Nécessaire car tldraw utilise window/document, incompatible avec le SSR Next.js
 */
import { Tldraw, type Editor, type TLStore } from "tldraw";
import "tldraw/tldraw.css";
import { BoardToolbar } from "./board-toolbar";
import { BoardAutosaveStatus } from "./board-autosave-status";
import { PilotysContextMenu } from "./pilotys-context-menu";

interface BoardCanvasProps {
  store: TLStore;
  onMount: (editor: Editor) => void | (() => void);
  projectId: string;
}

export function BoardCanvas({ store, onMount, projectId }: BoardCanvasProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Tldraw
        store={store}
        onMount={onMount}
        hideUi
        components={{
          ContextMenu: () => <PilotysContextMenu projectId={projectId} />,
        }}
      >
        <BoardToolbar />
        <BoardAutosaveStatus projectId={projectId} />
      </Tldraw>
    </div>
  );
}
