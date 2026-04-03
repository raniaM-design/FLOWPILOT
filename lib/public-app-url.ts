/**
 * URL publique canonique du site (emails, Stripe, liens magiques).
 *
 * Ordre : APP_URL (serveur, ex. Vercel Production) puis variables NEXT_PUBLIC_*
 * souvent définies au build, puis VERCEL_URL (sous-domaine *.vercel.app).
 *
 * Définir explicitement APP_URL=https://ton-domaine.com sur Vercel (Production)
 * évite que les emails utilisent l’URL de preview *.vercel.app.
 */
export function getPublicAppUrl(): string {
  const trim = (s: string | undefined) => {
    if (!s?.trim()) return "";
    return s.trim().replace(/\/+$/, "");
  };

  return (
    trim(process.env.APP_URL) ||
    trim(process.env.NEXT_PUBLIC_URL) ||
    trim(process.env.NEXT_PUBLIC_SITE_URL) ||
    trim(process.env.NEXT_PUBLIC_APP_URL) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : "") ||
    "http://localhost:3000"
  );
}
