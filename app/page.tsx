// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";
// Forcer le rendu dynamique car le layout utilise cookies() via getLocaleFromRequest()
export const dynamic = "force-dynamic";
// Landing page marketing - design premium type Miro/Canva/Notion/Linear

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { AnchorScrollHandler } from "@/components/marketing/anchor-scroll-handler";
import { getTranslations } from "@/i18n/request";
import {
  CheckSquare2,
  Target,
  Map,
  ArrowRight,
  LayoutGrid,
  UsersRound,
  MessageSquareWarning,
  KanbanSquare,
  GanttChart,
  Activity,
  Shield,
  Sparkles,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { LandingCTAButtons } from "@/components/landing/landing-cta-buttons";
import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingWhyPilotys } from "@/components/landing/landing-why-pilotys";
import { LandingDemoPreview } from "@/components/landing/landing-demo-preview";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingBeforeAfter } from "@/components/landing/landing-before-after";
import { LandingTrustSection } from "@/components/landing/landing-trust-section";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-screen bg-slate-50/80">
      <AnchorScrollHandler />
      <MarketingHeader />

      {/* 1. Hero — impact fort, clair */}
      <section className="container mx-auto px-4 md:px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 md:mb-8 leading-[1.08]">
            {t("hero.title")}
            <br />
            <span className="text-blue-600">{t("hero.titleHighlight")}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <LandingCTAButtons
            ctaPrimary={t("hero.ctaPrimary")}
            ctaSecondary={t("hero.ctaSecondary")}
          />
          <p className="text-sm text-slate-500 mb-10 font-medium">
            {t("hero.ctaMicroCopy")}
          </p>

          {/* 3 bullets */}
          {t.raw("hero.bullets") && (
            <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 mb-14 text-sm md:text-base text-slate-600 font-medium">
              {(t.raw("hero.bullets") as string[]).map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {/* Hero Visual — product preview mockup */}
          <div className="mt-6 md:mt-12 relative">
            <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
              <div className="bg-slate-50/80 border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900 text-sm md:text-base">PILOTYS</span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300" />
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-4 md:mb-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 mb-3">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{t("mockup.decisions")}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{t("mockup.decisionsActive")}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full w-[65%]" />
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-600 mt-1.5">{t("mockup.decisionsDecided")}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 mb-3">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <CheckSquare2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{t("mockup.actions")}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{t("mockup.actionsInProgress")}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full w-[42%]" />
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-600 mt-1.5">{t("mockup.actionsCompleted")}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 mb-3">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Map className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{t("mockup.projects")}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{t("mockup.projectsActive")}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full w-[78%]" />
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-600 mt-1.5">{t("mockup.projectsAdvanced")}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 md:p-5">
                  <h4 className="font-semibold text-slate-900 mb-3 text-xs md:text-sm">{t("mockup.kanbanBoard")}</h4>
                  <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                    {[t("mockup.todo"), t("mockup.inProgress"), t("mockup.inReview"), t("mockup.done")].map((status, idx) => (
                      <div
                        key={status}
                        className="flex-shrink-0 w-[130px] md:w-auto snap-center bg-white rounded-lg p-3 md:p-4 border border-slate-200 shadow-sm"
                      >
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] md:text-xs font-medium text-slate-600 line-clamp-1">{status}</span>
                          <span className="text-[10px] md:text-xs text-slate-400 ml-1">{idx + 2}</span>
                        </div>
                        <div className="space-y-1.5">
                          {[0, 1].map((i) => (
                            <div key={i} className="bg-slate-50 rounded p-1.5 border border-slate-100">
                              <div className="h-2 bg-slate-200 rounded mb-1 w-full" />
                              <div className="h-1.5 bg-slate-200 rounded w-2/3" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-purple-100 rounded-full blur-3xl opacity-40 -z-10" />
          </div>
        </div>
      </section>

      {/* 2. Avant / Après */}
      <LandingBeforeAfter
        title={t("problemSolution.title")}
        subtitle={t("problemSolution.subtitle")}
        before={{
          title: t("problemSolution.before.title"),
          points: (t.raw("problemSolution.before.points") as string[]) ?? [],
        }}
        after={{
          title: t("problemSolution.after.title"),
          points: (t.raw("problemSolution.after.points") as string[]) ?? [],
        }}
      />

      {/* 3. Fonctionnalités clés — 8 cards */}
      <section id="features" className="container mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {t("features.title")}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t("features.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LandingFeatureCard
            icon={UsersRound}
            title={t("featuresAll.meetings.title")}
            description={t("featuresAll.meetings.benefit")}
            benefit={t("featuresAll.meetings.description")}
            iconColor="purple"
          />
          <LandingFeatureCard
            icon={MessageSquareWarning}
            title={t("featuresAll.decisions.title")}
            description={t("featuresAll.decisions.benefit")}
            benefit={t("featuresAll.decisions.description")}
            iconColor="emerald"
          />
          <LandingFeatureCard
            icon={CheckSquare2}
            title={t("featuresAll.actions.title")}
            description={t("featuresAll.actions.benefit")}
            benefit={t("featuresAll.actions.description")}
            iconColor="blue"
          />
          <LandingFeatureCard
            icon={KanbanSquare}
            title={t("featuresAll.kanban.title")}
            description={t("featuresAll.kanban.benefit")}
            benefit={t("featuresAll.kanban.description")}
            iconColor="purple"
          />
          <LandingFeatureCard
            icon={Map}
            title={t("featuresAll.roadmap.title")}
            description={t("featuresAll.roadmap.benefit")}
            benefit={t("featuresAll.roadmap.description")}
            iconColor="emerald"
          />
          <LandingFeatureCard
            icon={GanttChart}
            title={t("featuresAll.gantt.title")}
            description={t("featuresAll.gantt.benefit")}
            benefit={t("featuresAll.gantt.description")}
            iconColor="blue"
          />
          <LandingFeatureCard
            icon={LayoutGrid}
            title={t("featuresAll.board.title")}
            description={t("featuresAll.board.benefit")}
            benefit={t("featuresAll.board.description")}
            iconColor="blue"
          />
          <LandingFeatureCard
            icon={Activity}
            title={t("featuresAll.blockers.title")}
            description={t("featuresAll.blockers.benefit")}
            benefit={t("featuresAll.blockers.description")}
            iconColor="amber"
          />
        </div>
      </section>

      {/* 4. Comment ça marche — 3 étapes */}
      <LandingHowItWorks
        title={t("howItWorks.title")}
        subtitle={t("howItWorks.subtitle")}
        steps={[
          { icon: Target, title: t("howItWorks.step1.title"), description: t("howItWorks.step1.description"), step: 1 },
          { icon: UsersRound, title: t("howItWorks.step2.title"), description: t("howItWorks.step2.description"), step: 2 },
          { icon: CheckSquare2, title: t("howItWorks.step3.title"), description: t("howItWorks.step3.description"), step: 3 },
        ]}
      />

      {/* 5. Pourquoi Pilotys */}
      <LandingWhyPilotys
        title={t("whyPilotys.title")}
        subtitle={t("whyPilotys.subtitle")}
        tagline={t("whyPilotys.tagline")}
        points={(t.raw("whyPilotys.points") as string[]) ?? []}
      />

      {/* 6. Aperçu produit */}
      <LandingDemoPreview title={t("demo.title")} subtitle={t("demo.subtitle")} />

      {/* 7. Section confiance */}
      <LandingTrustSection
        title={t("trust.title")}
        subtitle={t("trust.subtitle")}
        tagline={t("trust.tagline")}
        pillars={[
          { icon: Shield, title: t("trust.pillars.security.title"), description: t("trust.pillars.security.description") },
          { icon: Sparkles, title: t("trust.pillars.simplicity.title"), description: t("trust.pillars.simplicity.description") },
          { icon: FileCheck, title: t("trust.pillars.traceability.title"), description: t("trust.pillars.traceability.description") },
          { icon: CheckCircle2, title: t("trust.pillars.reliability.title"), description: t("trust.pillars.reliability.description") },
        ]}
      />

      {/* 8. FAQ */}
      <LandingFAQ
        title={t("faqLanding.title")}
        subtitle={t("faqLanding.subtitle")}
        items={(t.raw("faqLanding.items") as Array<{ question: string; answer: string }>) ?? []}
      />

      {/* 9. CTA final */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl md:rounded-3xl p-12 md:p-16 text-center text-white shadow-xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight">
            {t("cta.title")}
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all rounded-xl"
            >
              {t("cta.button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-base text-blue-100 mt-5 font-medium">{t("cta.microCopy")}</p>
        </div>
      </section>

      {/* 10. Footer */}
      <MarketingFooter />
    </div>
  );
}
