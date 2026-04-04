"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  MockBrowserChrome,
  MockDashboardPanel,
  MockDecisionsSnippet,
  MockKanbanSnippet,
  MockMeetingsPanel,
} from "@/components/landing/landing-app-mockups";

const TAB_IDS = ["meetings", "decisions", "actions", "views"] as const;
type TabId = (typeof TAB_IDS)[number];

export function LandingFeaturesShowcase() {
  const t = useTranslations("landing.showcase");
  const [tab, setTab] = useState<TabId>("meetings");

  return (
    <section id="features" className="border-t border-slate-100 bg-white py-14 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mb-8 text-center md:mb-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            {t("eyebrow")}
          </p>
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 md:text-lg">{t("subtitle")}</p>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-2 md:mb-8">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                tab === id
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {t(`tabs.${id}`)}
            </button>
          ))}
        </div>

        <MockBrowserChrome url="pilotys.io/app" className="mx-auto max-w-4xl">
          {tab === "meetings" && <MockMeetingsPanel />}
          {tab === "decisions" && <MockDecisionsSnippet />}
          {tab === "actions" && <MockKanbanSnippet />}
          {tab === "views" && <MockDashboardPanel compact />}
        </MockBrowserChrome>

        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-slate-500">{t(`blurbs.${tab}`)}</p>
      </div>
    </section>
  );
}
