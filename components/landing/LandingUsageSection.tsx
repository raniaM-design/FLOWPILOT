import { getTranslations } from "@/i18n/request";
import {
  MockBrowserChrome,
  MockDashboardPanel,
  MockMeetingsPanel,
} from "@/components/landing/landing-app-mockups";

export async function LandingUsageSection() {
  const t = await getTranslations("landing");

  const cards = [
    {
      key: "dashboard" as const,
      panel: <MockDashboardPanel compact />,
    },
    {
      key: "meetings" as const,
      panel: <MockMeetingsPanel compact />,
    },
  ];

  return (
    <section className="border-t border-slate-100 bg-slate-50/80 py-14 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mb-10 md:mb-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            {t("usage.eyebrow")}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            {t("usage.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">{t("usage.subtitle")}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          {cards.map(({ key, panel }) => (
            <div key={key} className="flex flex-col">
              <MockBrowserChrome url="pilotys.io/app" className="flex-1 shadow-lg">
                {panel}
              </MockBrowserChrome>
              <div className="mt-4">
                <span className="mb-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                  {t(`usage.cards.${key}.tag`)}
                </span>
                <h3 className="text-lg font-bold text-slate-900 md:text-xl">
                  {t(`usage.cards.${key}.heading`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 md:text-base">
                  {t(`usage.cards.${key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
