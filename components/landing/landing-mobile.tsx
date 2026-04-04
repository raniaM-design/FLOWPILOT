"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  MockBrowserChrome,
  MockDashboardPanel,
  MockMeetingsPanel,
} from "@/components/landing/landing-app-mockups";

type SecurityItem = { icon: string; title: string; desc: string };

/**
 * Landing pilotys.io — mobile (&lt;768px) : parcours court (hero, mockup réel, avant/après, sécurité, CTA).
 */
export function LandingMobile() {
  const t = useTranslations("landing.mobile");
  const tLanding = useTranslations("landing");
  const tMock = useTranslations("landing.mockups");
  const tLegal = useTranslations("legal.footer");

  const year = new Date().getFullYear();
  const beforePoints = (tLanding.raw("problemSolution.before.points") as string[]) ?? [];
  const afterPoints = (tLanding.raw("problemSolution.after.points") as string[]) ?? [];
  const securityItems = (t.raw("securityItems") as SecurityItem[] | undefined) ?? [];

  return (
    <div className="landing-mobile-root min-h-screen bg-white md:hidden">
      <header className="landing-mobile-nav flex h-[52px] items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 sm:px-4">
        <Link href="/" className="flex min-w-0 flex-1 items-center overflow-hidden" aria-label="PILOTYS">
          <Logo size="md" />
        </Link>
        <Link
          href="/login"
          className="flex-shrink-0 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          {t("login")}
        </Link>
        <Link
          href="/signup"
          className="flex-shrink-0 whitespace-nowrap rounded-lg bg-[#2563EB] px-2.5 py-2 text-xs font-semibold text-white shadow-sm sm:px-3 sm:text-sm"
        >
          {t("ctaHeader")}
        </Link>
      </header>

      <section className="landing-mobile-hero">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="mb-2 inline-flex min-[430px]:mb-4 items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            {t("badge")}
          </div>

          <h1 className="mb-2 min-[430px]:text-[26px] max-[429px]:text-[clamp(22px,6vw,32px)] font-extrabold leading-[1.15] text-[#111827]">
            {t("heroTitle")}
            <br />
            <span className="text-[#2563EB]">{t("heroHighlight")}</span>
          </h1>
          <p className="mb-6 text-[15px] leading-relaxed text-slate-600">{t("heroSubtitle")}</p>

          <Link
            href="/signup"
            className="landing-mobile-cta mb-3 flex w-full max-w-full items-center justify-center rounded-xl bg-[#2563EB] font-semibold text-white transition-opacity hover:opacity-95 active:opacity-90"
          >
            {t("cta")}
          </Link>
          <p className="text-center text-xs text-slate-500">{t("reassurance")}</p>
        </div>
      </section>

      <section className="landing-mobile-section !py-6">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
          {tMock("dashboardTitle")}
        </p>
        <div className="mx-auto max-w-md">
          <MockBrowserChrome url="pilotys.io/app" className="w-full shadow-lg">
            <MockDashboardPanel compact />
          </MockBrowserChrome>
        </div>
      </section>

      <section className="landing-mobile-section !py-8">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
          {tMock("meetingsTitle")}
        </p>
        <div className="mx-auto max-w-md">
          <MockBrowserChrome url="pilotys.io/app" className="w-full shadow-lg">
            <MockMeetingsPanel compact />
          </MockBrowserChrome>
        </div>
      </section>

      <section className="landing-mobile-section !py-8">
        <div className="mx-auto max-w-md space-y-4">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {t("compareEyebrow")}
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("beforeTitle")}
            </p>
            <ul className="space-y-2.5">
              {beforePoints.slice(0, 4).map((point, i) => (
                <li key={i} className="flex gap-2 text-left text-sm text-slate-800">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <X className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#2563EB] p-4 shadow-md">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
              {t("afterTitle")}
            </p>
            <ul className="space-y-2.5">
              {afterPoints.slice(0, 4).map((point, i) => (
                <li key={i} className="flex gap-2 text-left text-sm text-white">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-mobile-section !border-t !border-slate-100 !bg-slate-50/90 !py-10">
        <div className="mx-auto max-w-md">
          <p className="mb-1 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {t("securityEyebrow")}
          </p>
          <h2 className="mb-1 text-center text-xl font-extrabold text-slate-900">{t("securityTitle")}</h2>
          <p className="mb-6 text-center text-sm text-slate-600">{t("securitySubtitle")}</p>
          <div className="grid grid-cols-2 gap-3">
            {securityItems.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-indigo-100/80 bg-white p-3 shadow-sm"
              >
                <span className="text-xl" aria-hidden>
                  {item.icon}
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#1d4ed8] to-[#1e3a8a] px-5 py-12">
        <h2 className="mb-2 text-center text-xl font-extrabold leading-snug text-white">{t("finalTitle")}</h2>
        <p className="mb-6 text-center text-sm text-blue-100">{t("finalSubtitle")}</p>
        <Link
          href="/signup"
          className="mx-auto mb-4 flex h-[50px] w-full max-w-sm items-center justify-center rounded-full bg-white text-base font-semibold text-[#2563EB] shadow-lg"
        >
          {t("cta")}
        </Link>
        <p className="text-center text-xs text-blue-200">{t("finalMicro")}</p>
      </section>

      <footer className="border-t border-slate-100 px-5 py-8">
        <div className="mb-4 flex justify-center">
          <Logo href="/" size="md" />
        </div>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-slate-600"
          aria-label="Pied de page"
        >
          <Link href="/legal/mentions-legales" className="underline-offset-2 hover:text-slate-900 hover:underline">
            {tLegal("mentionsLegales")}
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/legal/confidentialite" className="underline-offset-2 hover:text-slate-900 hover:underline">
            {tLegal("confidentialite")}
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/legal/cgu" className="underline-offset-2 hover:text-slate-900 hover:underline">
            {tLegal("cgu")}
          </Link>
          <span className="text-slate-300">·</span>
          <span>
            © {year} {t("brand")}
          </span>
        </nav>
      </footer>
    </div>
  );
}
