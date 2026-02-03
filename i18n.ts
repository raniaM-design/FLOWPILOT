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
  const messages = await getMessagesFromRequest(locale);

  return {
    locale,
    messages,
  };
});

