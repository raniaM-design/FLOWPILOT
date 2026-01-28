"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { showActionCreatedToast } from "@/lib/toast-actions";

/**
 * Composant client pour gérer les toasts sur la page des actions
 * Affiche un toast de succès si l'action vient d'être créée
 */
export function ActionsPageClient() {
  const searchParams = useSearchParams();
  const created = searchParams.get("created");

  useEffect(() => {
    if (created === "true") {
      showActionCreatedToast("Votre action a été ajoutée à votre liste.");
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [created]);

  return null;
}

