"use client";

/**
 * Menu contextuel Pilotys — "Créer une Action" et "Créer une Décision"
 * Affiche un modal avec titre pré-rempli depuis le texte du post-it
 */
import { useState } from "react";
import { useEditor, useValue } from "tldraw";
import { DefaultContextMenu } from "tldraw";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { ListTodo, CheckSquare2 } from "lucide-react";
import { getPlainTextFromRichText } from "@/lib/board/rich-text-utils";
import { CreatePilotysModal } from "./create-pilotys-modal";

interface PilotysContextMenuWrapperProps {
  projectId: string;
}

function PilotysContextMenuContent({ projectId }: { projectId: string }) {
  const editor = useEditor();
  const [modalType, setModalType] = useState<"action" | "decision" | null>(null);

  const onlyShape = useValue(
    "onlySelectedShape",
    () => editor.getOnlySelectedShape(),
    [editor]
  );

  const selectToolActive = useValue(
    "isSelectToolActive",
    () => editor.getCurrentToolId() === "select",
    [editor]
  );

  const getTitleFromShape = () => {
    if (!onlyShape) return "";
    const props = onlyShape.props as { richText?: unknown };
    if (props?.richText) {
      return getPlainTextFromRichText(props.richText as Parameters<typeof getPlainTextFromRichText>[0]);
    }
    return "";
  };

  const handleAction = (type: "action" | "decision") => {
    setModalType(type);
  };

  if (!selectToolActive || !onlyShape) return null;

  return (
    <>
      <div className="px-1 py-1">
        <ContextMenu.Item
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 data-[highlighted]:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:data-[highlighted]:bg-emerald-950/50"
          onSelect={() => handleAction("action")}
        >
          <ListTodo className="h-4 w-4" />
          Créer une Action Pilotys
        </ContextMenu.Item>
        <ContextMenu.Item
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 data-[highlighted]:bg-purple-50 dark:hover:bg-purple-950/50 dark:data-[highlighted]:bg-purple-950/50"
          onSelect={() => handleAction("decision")}
        >
          <CheckSquare2 className="h-4 w-4" />
          Créer une Décision Pilotys
        </ContextMenu.Item>
      </div>
      {modalType && (
        <CreatePilotysModal
          open={true}
          onOpenChange={(open) => !open && setModalType(null)}
          type={modalType}
          initialTitle={getTitleFromShape()}
          projectId={projectId}
        />
      )}
    </>
  );
}

export function PilotysContextMenu({ projectId }: PilotysContextMenuWrapperProps) {
  return (
    <DefaultContextMenu>
      <PilotysContextMenuContent projectId={projectId} />
    </DefaultContextMenu>
  );
}
