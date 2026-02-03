/**
 * Utilitaire pour afficher des toasts de succès lors de la création d'actions
 * Assure un message uniforme dans toute l'application
 */

import { toast } from "sonner";

/**
 * Interface pour les messages traduits
 */
interface ToastMessages {
  success: string;
  description: string;
  descriptionPlural?: string;
  descriptionSingular?: string;
  updated?: string;
  updatedDescription?: string;
}

/**
 * Messages par défaut en français (fallback)
 */
const defaultMessages: ToastMessages = {
  success: "Action créée avec succès",
  description: "Votre action a été ajoutée à votre liste.",
  descriptionPlural: "ont été créées avec succès.",
  descriptionSingular: "a été créée avec succès.",
  updated: "Action mise à jour",
  updatedDescription: "Les modifications ont été enregistrées.",
};

/**
 * Affiche un toast de succès pour la création d'une action
 * @param description Description optionnelle (sera traduite si non fournie)
 * @param messages Messages traduits optionnels
 */
export function showActionCreatedToast(description?: string, messages?: Partial<ToastMessages>) {
  const msgs = { ...defaultMessages, ...messages };
  toast.success(msgs.success, {
    description: description || msgs.description,
  });
}

/**
 * Affiche un toast de succès pour la création de plusieurs actions
 * @param count Nombre d'actions créées
 * @param messages Messages traduits optionnels
 */
export function showActionsCreatedToast(count: number, messages?: Partial<ToastMessages>) {
  const msgs = { ...defaultMessages, ...messages };
  const actionText = count > 1 ? `${count} actions` : `${count} action`;
  const verbText = count > 1 
    ? (msgs.descriptionPlural || "ont été créées avec succès.")
    : (msgs.descriptionSingular || "a été créée avec succès.");
  
  toast.success(msgs.success, {
    description: `${actionText} ${verbText}`,
  });
}

/**
 * Affiche un toast de succès pour la mise à jour d'une action
 * @param description Description optionnelle (sera traduite si non fournie)
 * @param messages Messages traduits optionnels
 */
export function showActionUpdatedToast(description?: string, messages?: Partial<ToastMessages>) {
  const msgs = { ...defaultMessages, ...messages };
  toast.success(msgs.updated || "Action mise à jour", {
    description: description || msgs.updatedDescription || "Les modifications ont été enregistrées.",
  });
}

