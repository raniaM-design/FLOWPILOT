/**
 * Helper pour charger la config i18n directement dans les Server Components
 * Sans passer par le middleware (Edge-safe)
 * 
 * Remplace les fonctions de next-intl/server qui nécessitent getRequestConfig
 */
import { cookies } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

export async function getLocaleFromRequest(): Promise<Locale> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("pilotys_language")?.value;
  
  if (langCookie && locales.includes(langCookie as Locale)) {
    return langCookie as Locale;
  }
  
  return defaultLocale;
}

export async function getMessagesFromRequest(): Promise<Record<string, any>> {
  const locale = await getLocaleFromRequest();
  
  try {
    if (locale === "en") {
      const enModule = await import("@/messages/en.json");
      return enModule.default || enModule;
    } else {
      const frModule = await import("@/messages/fr.json");
      return frModule.default || frModule;
    }
  } catch (error) {
    console.error("Erreur lors du chargement des messages:", error);
    const frModule = await import("@/messages/fr.json");
    return frModule.default || frModule;
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

