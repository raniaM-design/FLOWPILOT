"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { showActionCreatedToast } from "@/lib/toast-actions";
import { useTranslations } from "next-intl";

/**
 * Composant client pour gérer les toasts sur la page des actions
 * Affiche un toast de succès si l'action vient d'être créée
 */
export function ActionsPageClient() {
  const searchParams = useSearchParams();
  const created = searchParams.get("created");
  const t = useTranslations("actions");

  useEffect(() => {
    if (created === "true") {
      const toastMessages = {
        success: t("actionCreatedSuccess"),
        description: t("actionCreatedDescription"),
      };
      showActionCreatedToast(t("actionCreatedDescription"), toastMessages);
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [created, t]);

  return null;
}

