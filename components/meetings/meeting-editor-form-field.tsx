"use client";

import { MeetingEditor } from "./meeting-editor";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

interface MeetingEditorFormFieldProps {
  id: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface MeetingEditorFormFieldRef {
  setContent: (content: string) => void;
}

/**
 * Wrapper pour intégrer MeetingEditor dans les formulaires serveur
 * Gère l'état local et synchronise avec un input caché pour la soumission
 */
export const MeetingEditorFormField = forwardRef<
  MeetingEditorFormFieldRef,
  MeetingEditorFormFieldProps
>(({ id, name, placeholder, defaultValue = "", required = false }, ref) => {
  const [value, setValue] = useState(defaultValue);

  // Mettre à jour la valeur si defaultValue change
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Exposer une méthode pour définir le contenu depuis l'extérieur
  useImperativeHandle(ref, () => ({
    setContent: (content: string) => {
      setValue(content);
    },
  }));

  return (
    <MeetingEditor
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      name={name}
    />
  );
});

MeetingEditorFormField.displayName = "MeetingEditorFormField";

