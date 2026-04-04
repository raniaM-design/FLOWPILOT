"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, ListTodo, Route, type LucideIcon } from "lucide-react";

function MobileHeaderLogo() {
  const t = useTranslations("landing.mobile");
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: "#4338ca",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          P
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1a1a2e",
            letterSpacing: "-0.3px",
          }}
        >
          {t("brandWordmark")}
        </span>
      </div>
    );
  }

  return (
    <img
      src="/branding/logo-full.png"
      alt="Pilotys"
      height={28}
      width={120}
      style={{
        display: "block",
        height: 28,
        width: "auto",
        maxWidth: 160,
        objectFit: "contain",
      }}
      onError={() => setImgFailed(true)}
    />
  );
}

const FEATURE_ICONS: LucideIcon[] = [FileText, ListTodo, Route];

/**
 * Landing pilotys.io — version mobile (<768px) : 4 sections courtes, contenu factuel.
 */
export function LandingMobile() {
  const t = useTranslations("landing.mobile");
  const tLegal = useTranslations("legal.footer");

  const year = new Date().getFullYear();

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
  ] as const;

  return (
    <div className="landing-mobile-root min-h-screen bg-white md:hidden">
      {/* Nav minimaliste */}
      <header className="landing-mobile-nav flex h-[52px] items-center justify-between border-b border-slate-200/80 bg-white px-5">
        <Link href="/" className="flex items-center">
          <MobileHeaderLogo />
        </Link>
        <Link
          href="/login"
          className="text-[15px] font-medium text-slate-700 hover:text-slate-900"
        >
          {t("login")}
        </Link>
      </header>

      {/* SECTION 1 — Hero : 100vh − header, contenu centré */}
      <section className="landing-mobile-hero">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#ede9fe",
              color: "#4338ca",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            {t("badge")}
          </div>

          <h1 className="mb-3 text-[30px] font-bold leading-[1.25] text-[#1a1a2e]">
            {t("heroTitle")}
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-slate-500">
            {t("heroSubtitle")}
          </p>
          <Link
            href="/signup"
            className="landing-mobile-cta mb-4 flex h-[52px] w-full max-w-full items-center justify-center rounded-xl bg-[#4338ca] text-base font-semibold text-white transition-opacity hover:opacity-95 active:opacity-90"
          >
            {t("cta")}
          </Link>
          <p className="text-center text-xs leading-relaxed text-slate-500">
            {t("reassurance")}
          </p>
        </div>
      </section>

      {/* SECTION 2 — Ce que ça fait */}
      <section className="landing-mobile-section">
        <ul className="mx-auto max-w-md">
          {features.map((text, i) => {
            const Icon = FEATURE_ICONS[i]!;
            const isLast = i === features.length - 1;
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 0",
                  borderBottom: isLast ? undefined : "0.5px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "#ede9fe",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    className="text-[#4338ca]"
                    style={{ width: 18, height: 18 }}
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <span
                  style={{
                    fontSize: 15,
                    color: "#1a1a2e",
                    fontWeight: 450,
                    lineHeight: 1.4,
                  }}
                >
                  {text}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 3 — Accès fondateur */}
      <section className="landing-mobile-section">
        <div
          className="mx-auto max-w-md"
          style={{
            background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
            border: "1px solid #c4b5fd",
            borderRadius: 16,
            padding: 20,
            margin: "0 0 32px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#7c3aed",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t("founderEyebrow")}
          </div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#1a1a2e",
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            {t("founderBody")}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#6366f1",
              margin: 0,
            }}
          >
            {t("founderSub")}
          </p>
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
