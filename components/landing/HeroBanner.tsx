import Link from "next/link";
import { getTranslations } from "@/i18n/request";
import {
  MockBrowserChrome,
  MockDashboardPanel,
} from "@/components/landing/landing-app-mockups";

const HERO_GIF = process.env.NEXT_PUBLIC_HERO_DEMO_GIF?.trim();

export default async function HeroBanner() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-white" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 pb-12 pt-10 md:flex-row md:items-start md:gap-14 md:px-6 md:pb-20 md:pt-20 lg:gap-16">
        <div className="w-full flex-1 text-center md:text-left">
          <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 md:mb-6 md:px-4 md:text-xs">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span className="line-clamp-2 text-left leading-snug">{t("badge")}</span>
          </div>

          <h1 className="mb-4 text-[28px] font-extrabold leading-[1.15] text-gray-900 md:mb-6 md:text-4xl lg:text-5xl xl:text-[3.25rem] xl:leading-tight">
            {t("title")}
            <br />
            <span className="text-indigo-600">{t("titleHighlight")}</span>
          </h1>

          <p className="mx-auto mb-6 max-w-xl text-[15px] leading-snug text-gray-500 md:mx-0 md:mb-8 md:text-lg md:leading-relaxed lg:text-xl">
            {t("subtitle")}
          </p>

          <div className="mb-6 flex w-full flex-col gap-3 md:mb-8 md:w-auto md:flex-row md:justify-start">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 md:w-auto"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 transition-all hover:bg-indigo-50 md:w-auto"
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          {HERO_GIF ? (
            <div className="mx-auto mb-6 w-full max-w-sm md:hidden">
              <img
                src={HERO_GIF}
                alt=""
                width={320}
                height={200}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="mx-auto h-auto max-h-52 w-full rounded-xl border border-gray-200 object-contain"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400 md:justify-start md:gap-4 md:text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> {t("trust1")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> {t("trust2")}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="text-green-500">✓</span> {t("trust3")}
            </span>
          </div>
        </div>

        <div className="hidden w-full min-w-0 max-w-xl flex-1 md:block">
          <MockBrowserChrome url="pilotys.io/app" className="w-full">
            <MockDashboardPanel />
          </MockBrowserChrome>
        </div>
      </div>
    </section>
  );
}
