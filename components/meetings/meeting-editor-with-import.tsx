"use client";

import { useRef, useState, useEffect } from "react";
import { MeetingEditorFormField, MeetingEditorFormFieldRef } from "./meeting-editor-form-field";
import { ImportMeetingModal } from "./import-meeting-modal";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

interface MeetingEditorWithImportProps {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}

// Variable globale pour stocker la référence de l'éditeur
let globalEditorRef: MeetingEditorFormFieldRef | null = null;

/**
 * Composant wrapper qui ajoute le bouton "Importer" à l'éditeur
 */
export function MeetingEditorWithImport({
  id,
  name,
  placeholder,
  required,
}: MeetingEditorWithImportProps) {
  const editorRef = useRef<MeetingEditorFormFieldRef>(null);

  // Enregistrer la référence globale
  useEffect(() => {
    if (editorRef.current) {
      globalEditorRef = editorRef.current;
    }
    return () => {
      if (globalEditorRef === editorRef.current) {
        globalEditorRef = null;
      }
    };
  }, []);

  // Écouter les événements d'import
  useEffect(() => {
    const handleImport = (event: CustomEvent<{ content: string }>) => {
      editorRef.current?.setContent(event.detail.content);
    };

    window.addEventListener("meeting-import" as any, handleImport);
    return () => {
      window.removeEventListener("meeting-import" as any, handleImport);
    };
  }, []);

  return (
    <MeetingEditorFormField
      ref={editorRef}
      id={id}
      name={name}
      placeholder={placeholder}
      required={required}
    />
  );
}

/**
 * Composant bouton d'import séparé pour être placé dans le header
 */
export function ImportMeetingButton() {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImport = (content: string) => {
    // Utiliser un événement personnalisé pour communiquer avec l'éditeur
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

