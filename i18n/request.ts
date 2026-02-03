/**
 * Helper pour charger la config i18n directement dans les Server Components
 * Sans passer par le middleware (Edge-safe)
 * 
 * Remplace les fonctions de next-intl/server qui nécessitent getRequestConfig
 */
import { cookies } from "next/headers";

// Constantes locales (remplace i18n/config.ts temporairement désactivé)
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export async function getLocaleFromRequest(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("pilotys_language")?.value;
    
    console.log("[i18n] Cookie lu:", langCookie || "non défini");
    
    if (langCookie && locales.includes(langCookie as Locale)) {
      console.log("[i18n] Locale détectée:", langCookie);
      return langCookie as Locale;
    }
    
    console.log("[i18n] Utilisation de la locale par défaut: fr");
    return defaultLocale;
  } catch (error) {
    console.error("[i18n] Error in getLocaleFromRequest:", error);
    return defaultLocale;
  }
}

export async function getMessagesFromRequest(): Promise<Record<string, any>> {
  try {
    const locale = await getLocaleFromRequest();
    
    try {
      if (locale === "en") {
        const enModule = await import("@/messages/en.json");
        const messages = enModule.default || enModule;
        console.log("[i18n] Messages anglais chargés:", Object.keys(messages).length, "clés");
        return messages;
      } else {
        const frModule = await import("@/messages/fr.json");
        const messages = frModule.default || frModule;
        console.log("[i18n] Messages français chargés:", Object.keys(messages).length, "clés");
        return messages;
      }
    } catch (error) {
      console.error("[i18n] Error loading messages for locale:", locale, error);
      // Fallback sur français
      try {
        const frModule = await import("@/messages/fr.json");
        return frModule.default || frModule;
      } catch (fallbackError) {
        console.error("[i18n] Error loading fallback messages:", fallbackError);
        return {};
      }
    }
  } catch (error) {
    console.error("[i18n] Error in getMessagesFromRequest:", error);
    return {};
  }
}

/**
 * Wrapper pour getTranslations compatible avec next-intl
 * Utilise les messages chargés directement sans middleware
 */
export async function getTranslations(namespace?: string) {
  const messages = await getMessagesFromRequest();
  
  return (key: string, values?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split(".");
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return fullKey; // Fallback sur la clé si non trouvée
      }
    }
    
    if (typeof value !== "string") {
      return fullKey;
    }
    
    // Simple remplacement de variables (ex: {name} -> values.name)
    if (values) {
      return value.replace(/\{(\w+)\}/g, (_, varName) => {
        return values[varName]?.toString() || `{${varName}}`;
      });
    }
    
    return value;
  };
}

