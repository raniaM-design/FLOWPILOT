import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale: Locale = defaultLocale;

  // IMPORTANT: Ne pas utiliser Prisma dans ce fichier car il est chargé par next-intl
  // qui peut s'exécuter en Edge Runtime où __dirname n'existe pas.
  // Prisma Client utilise 'path' qui nécessite __dirname.
  // 
  // Solution: Utiliser uniquement les cookies pour la langue (Edge-safe).
  // La préférence utilisateur en DB sera gérée dans les pages Server Components (Node.js runtime).
  
  // Vérifier le cookie de langue
  const langCookie = cookieStore.get("pilotys_language")?.value;
  if (langCookie && locales.includes(langCookie as Locale)) {
    locale = langCookie as Locale;
  }

  // Charger les messages selon la locale
  // Utilisation de chemins absolus pour éviter les problèmes de résolution
  let messages;
  try {
    if (locale === "en") {
      const enModule = await import("@/messages/en.json");
      messages = enModule.default || enModule;
    } else {
      const frModule = await import("@/messages/fr.json");
      messages = frModule.default || frModule;
    }
  } catch (error) {
    // Fallback sur français si erreur
    console.error("Erreur lors du chargement des messages:", error);
    const frModule = await import("@/messages/fr.json");
    messages = frModule.default || frModule;
  }

  return {
    locale,
    messages,
  };
});
