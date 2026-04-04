"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, ListTodo, Route } from "lucide-react";

/**
 * Landing pilotys.io — version mobile (<768px) : 4 sections courtes, contenu factuel.
 */
export function LandingMobile() {
  const t = useTranslations("landing.mobile");
  const tLegal = useTranslations("legal.footer");

  const year = new Date().getFullYear();

  return (
    <div className="landing-mobile-root min-h-screen bg-white md:hidden">
      {/* Nav minimaliste */}
      <header className="landing-mobile-nav flex h-[52px] items-center justify-between border-b border-slate-200/80 bg-white px-5">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-[#1a1a2e]"
          style={{ fontSize: "14px" }}
        >
          {t("brand")}
        </Link>
        <Link
          href="/login"
          className="text-[15px] font-medium text-slate-700 hover:text-slate-900"
        >
          {t("login")}
        </Link>
      </header>

      {/* SECTION 1 — Hero (~1 écran) */}
      <section className="landing-mobile-hero flex min-h-[calc(100dvh-52px)] flex-col justify-center px-5 py-10">
        <h1 className="mb-3 text-center text-[30px] font-bold leading-[1.25] text-[#1a1a2e]">
          {t("heroTitle")}
        </h1>
        <p className="mb-8 text-center text-[15px] leading-relaxed text-slate-500">
          {t("heroSubtitle")}
        </p>
        <Link
          href="/signup"
          className="landing-mobile-cta mb-4 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#4338ca] text-base font-semibold text-white transition-opacity hover:opacity-95 active:opacity-90"
        >
          {t("cta")}
        </Link>
        <p className="text-center text-xs leading-relaxed text-slate-500">
          {t("reassurance")}
        </p>
      </section>

      {/* SECTION 2 — Ce que ça fait */}
      <section className="landing-mobile-section">
        <ul className="mx-auto max-w-md space-y-5">
          <li className="flex gap-3 text-[15px] leading-snug text-slate-800">
            <FileText
              className="mt-0.5 h-5 w-5 shrink-0 text-[#4338ca]"
              strokeWidth={2}
              aria-hidden
            />
            <span>{t("feature1")}</span>
          </li>
          <li className="flex gap-3 text-[15px] leading-snug text-slate-800">
            <ListTodo
              className="mt-0.5 h-5 w-5 shrink-0 text-[#4338ca]"
              strokeWidth={2}
              aria-hidden
            />
            <span>{t("feature2")}</span>
          </li>
          <li className="flex gap-3 text-[15px] leading-snug text-slate-800">
            <Route
              className="mt-0.5 h-5 w-5 shrink-0 text-[#4338ca]"
              strokeWidth={2}
              aria-hidden
            />
            <span>{t("feature3")}</span>
          </li>
        </ul>
      </section>

      {/* SECTION 3 — Preuve honnête */}
      <section className="landing-mobile-section">
        <div
          className="mx-auto max-w-md rounded-xl px-4 py-5 text-[15px] leading-relaxed text-slate-800"
          style={{ backgroundColor: "#f5f3ff" }}
        >
          <p>{t("honestBox")}</p>
          <p className="mt-3 text-sm text-slate-600">{t("honestNote")}</p>
        </div>
      </section>

      {/* SECTION 4 — CTA final + footer */}
      <section className="landing-mobile-section">
        <p className="mb-6 text-center text-[20px] font-semibold leading-snug text-[#1a1a2e]">
          {t("finalTitle")}
        </p>
        <Link
          href="/signup"
          className="landing-mobile-cta mb-10 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#4338ca] text-base font-semibold text-white transition-opacity hover:opacity-95"
        >
          {t("cta")}
        </Link>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs text-slate-600"
          aria-label="Pied de page"
        >
          <span className="font-bold text-[#1a1a2e]">{t("brand")}</span>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <Link href="/legal/mentions-legales" className="underline-offset-2 hover:text-slate-900 hover:underline">
            {tLegal("mentionsLegales")}
          </Link>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <Link href="/legal/cgu" className="underline-offset-2 hover:text-slate-900 hover:underline">
            {tLegal("cgu")}
          </Link>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <span>
            © {year} {t("brand")}
          </span>
        </nav>
      </section>
    </div>
  );
}
