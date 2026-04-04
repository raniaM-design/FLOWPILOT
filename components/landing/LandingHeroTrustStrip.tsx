import { getTranslations } from "@/i18n/request";

export async function LandingHeroTrustStrip() {
  const t = await getTranslations("landing");

  const keys = ["europe", "gdpr", "quickstart", "nocard"] as const;

  return (
    <div className="border-b border-slate-100 bg-white py-4 md:py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 text-center text-xs font-medium text-slate-600 md:gap-x-10 md:px-6 md:text-sm">
        {keys.map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="text-emerald-500" aria-hidden>
              ✓
            </span>
            {t(`heroTrust.${key}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
