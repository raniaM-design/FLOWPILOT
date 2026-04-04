"use client";

import { useTranslations } from "next-intl";
import { MockBrowserChrome, MockMeetingsPanel } from "@/components/landing/landing-app-mockups";

export function LandingDesktopMeetingsMock() {
  const t = useTranslations("landing.mockups");

  return (
    <section
      id="product-preview"
      className="border-b border-slate-100 bg-slate-50/40 py-10 md:py-14"
      aria-label={t("sectionTitle")}
    >
      <div className="mx-auto max-w-5xl px-5 md:px-6">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-indigo-600">
          {t("sectionTitle")}
        </p>
        <p className="mb-4 text-center text-base font-semibold text-slate-800">{t("meetingsTitle")}</p>
        <MockBrowserChrome url="pilotys.io/app" className="w-full shadow-lg">
          <MockMeetingsPanel />
        </MockBrowserChrome>
      </div>
    </section>
  );
}
