"use client";

import { RichTextField } from "@/components/ui/rich-text-field";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";

interface RichTextFormFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

/**
 * Fonction pour compter les mots dans un texte HTML
 */
function countWords(html: string): number {
  if (!html || html.trim() === "") return 0;
  // Créer un élément temporaire pour extraire le texte
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  // Compter les mots (séparés par des espaces)
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Composant wrapper pour intégrer RichTextField dans les formulaires serveur
 * Gère l'état local et synchronise avec un input caché pour la soumission
 */
export function RichTextFormField({
  id,
  name,
  label,
  placeholder,
  defaultValue = "",
  required = false,
  description,
  className,
}: RichTextFormFieldProps) {
  const [value, setValue] = useState(defaultValue);
  
  // Compter les mots
  const wordCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return countWords(value);
  }, [value]);

  const isMeetingNotesEditor = className?.includes("meeting-notes-editor");

  return (
    <div className={className}>
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <RichTextField
          value={value}
          onChange={setValue}
          placeholder={placeholder}
          name={name}
          className={isMeetingNotesEditor ? "meeting-notes-editor" : undefined}
        />
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
        {/* Compteur de mots discret pour l'éditeur de compte rendu */}
        {isMeetingNotesEditor && (
          <div className="flex justify-end pt-1">
            <span className="text-xs text-slate-400 font-medium">
              {wordCount} {wordCount <= 1 ? "mot" : "mots"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

