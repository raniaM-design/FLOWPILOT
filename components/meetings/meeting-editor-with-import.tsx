"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import {
  MeetingEditorFormField,
  MeetingEditorFormFieldRef,
} from "./meeting-editor-form-field";
import { ImportMeetingModal } from "./import-meeting-modal";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

interface MeetingEditorWithImportProps {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}

export const MeetingEditorWithImport = forwardRef<
  MeetingEditorFormFieldRef,
  MeetingEditorWithImportProps
>(({ id, name, placeholder, required }, ref) => {
  const innerRef = useRef<MeetingEditorFormFieldRef>(null);

  useImperativeHandle(ref, () => ({
    setContent: (c: string) => innerRef.current?.setContent(c),
    getContent: () => innerRef.current?.getContent() ?? "",
  }));

  useEffect(() => {
    const handleImport = (event: CustomEvent<{ content: string }>) => {
      innerRef.current?.setContent(event.detail.content);
    };

    window.addEventListener("meeting-import" as never, handleImport);
    return () => {
      window.removeEventListener("meeting-import" as never, handleImport);
    };
  }, []);

  return (
    <MeetingEditorFormField
      ref={innerRef}
      id={id}
      name={name}
      placeholder={placeholder}
      required={required}
    />
  );
});

MeetingEditorWithImport.displayName = "MeetingEditorWithImport";

export function ImportMeetingButton() {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImport = (content: string) => {
    const event = new CustomEvent("meeting-import", { detail: { content } });
    window.dispatchEvent(event);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowImportModal(true)}
        className="bg-white shadow-sm hover:bg-slate-50"
      >
        <FileUp className="h-4 w-4 mr-2" />
        Importer
      </Button>

      <ImportMeetingModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={handleImport}
      />
    </>
  );
}
