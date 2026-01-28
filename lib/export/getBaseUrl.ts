/**
 * Récupère l'URL de base de l'application pour Playwright
 * Utilisé pour accéder aux pages d'export depuis le serveur
 */
export function getBaseUrl(): string {
  // Priorité 1: APP_URL (server env)
  if (process.env.APP_URL) {
    const url = process.env.APP_URL.replace(/\/$/, "");
    console.log(`[getBaseUrl] Using APP_URL: ${url}`);
    return url;
  }

  // Priorité 2: NEXT_PUBLIC_APP_URL (public env)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    console.log(`[getBaseUrl] Using NEXT_PUBLIC_APP_URL: ${url}`);
    return url;
  }

  // Fallback: localhost pour dev
  const port = process.env.PORT || "3000";
  const url = `http://localhost:${port}`;
  console.log(`[getBaseUrl] Using fallback localhost: ${url}`);
  return url;
}

