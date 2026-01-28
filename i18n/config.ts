import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { readSessionCookie } from "@/lib/flowpilot-auth/session";

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale: Locale = defaultLocale;

  // 1. Vérifier la préférence utilisateur en DB
  try {
    const token = cookieStore.get("flowpilot_session")?.value;
    if (token) {
      const userId = await readSessionCookie({
        cookies: () => cookieStore,
      } as any);

      if (userId) {
        try {
          // Tentative de récupération de preferredLanguage (résilient si la colonne n'existe pas encore)
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          // Vérifier si preferredLanguage existe et est valide (résilient si la colonne n'existe pas)
          if (user && (user as any).preferredLanguage && locales.includes((user as any).preferredLanguage as Locale)) {
            locale = (user as any).preferredLanguage as Locale;
          }
        } catch (error) {
          // Si la colonne preferredLanguage n'existe pas encore, ignorer l'erreur
          // Le login fonctionnera toujours avec la langue par défaut
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  // 2. Vérifier le cookie de langue
  if (locale === defaultLocale) {
    const langCookie = cookieStore.get("pilotys_language")?.value;
    if (langCookie && locales.includes(langCookie as Locale)) {
      locale = langCookie as Locale;
    }
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
