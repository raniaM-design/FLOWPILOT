import { getRequestConfig } from "next-intl/server";
import { getLocaleFromRequest, getMessagesFromRequest } from "./i18n/request";

/**
 * Configuration next-intl pour le middleware
 * 
 * Note: Ce fichier est détecté automatiquement par next-intl.
 * Il charge la locale et les messages depuis les cookies (Edge-safe).
 */
export default getRequestConfig(async () => {
  const locale = await getLocaleFromRequest();
  // getMessagesFromRequest() ne prend pas d'argument, elle appelle getLocaleFromRequest() en interne
  const messages = await getMessagesFromRequest();

  return {
    locale,
    messages,
  };
});
