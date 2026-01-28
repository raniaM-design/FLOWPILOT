/**
 * Utilitaire pour afficher des toasts de succès lors de la création d'actions
 * Assure un message uniforme dans toute l'application
 */

import { toast } from "sonner";

/**
 * Affiche un toast de succès pour la création d'une action
 * Message uniforme : "Action créée avec succès"
 */
export function showActionCreatedToast(description?: string) {
  toast.success("Action créée avec succès", {
    description: description || "Votre action a été ajoutée à votre liste.",
  });
}

/**
 * Affiche un toast de succès pour la création de plusieurs actions
 */
export function showActionsCreatedToast(count: number) {
  toast.success("Action créée avec succès", {
    description: `${count} action${count > 1 ? "s" : ""} ${count > 1 ? "ont été créées" : "a été créée"} avec succès.`,
  });
}

/**
 * Affiche un toast de succès pour la mise à jour d'une action
 * Message uniforme : "Action mise à jour"
 */
export function showActionUpdatedToast(description?: string) {
  toast.success("Action mise à jour", {
    description: description || "Les modifications ont été enregistrées.",
  });
}

