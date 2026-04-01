// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";
// Forcer le rendu dynamique car le layout utilise cookies() via getLocaleFromRequest()
export const dynamic = "force-dynamic";
// Landing page marketing - design premium type Miro/Canva/Notion/Linear

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { AnchorScrollHandler } from "@/components/marketing/anchor-scroll-handler";
import { getTranslations } from "@/i18n/request";
import {
  CheckSquare2,
  Target,
  Map,
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
import { LandingFeatureCard } from "@/components/landing/landing-feature-card";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingWhyPilotys } from "@/components/landing/landing-why-pilotys";
import { LandingDemoPreview } from "@/components/landing/landing-demo-preview";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingBeforeAfter } from "@/components/landing/landing-before-after";
import { LandingTrustSection } from "@/components/landing/landing-trust-section";
import HeroBanner from "@/components/landing/HeroBanner";
import SocialProofBanner from "@/components/landing/SocialProofBanner";
import RoiSection from "@/components/landing/RoiSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CtaBanner from "@/components/landing/CtaBanner";
import PersonasSection from "@/components/landing/PersonasSection";
import CompetitorTable from "@/components/landing/CompetitorTable";
import TrustBadges from "@/components/landing/TrustBadges";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-screen bg-slate-50/80">
      <AnchorScrollHandler />
      <MarketingHeader />

      {/* 1. Hero + social proof (Phase 1 conversion) */}
      <HeroBanner />
      <SocialProofBanner />

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

      {/* Phase 2 — Personas (Pour qui ?) */}
      <PersonasSection />

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

      {/* 6. Aperçu produit + vidéo démo */}
      <LandingDemoPreview
        title={t("demo.title")}
        subtitle={t("demo.subtitle")}
        videoUrl={process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? undefined}
      />

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

      {/* ROI + témoignages (Phase 1) */}
      <RoiSection />
      <TestimonialsSection />

      {/* 8. FAQ */}
      <LandingFAQ
        title={t("faqLanding.title")}
        subtitle={t("faqLanding.subtitle")}
        items={(t.raw("faqLanding.items") as Array<{ question: string; answer: string }>) ?? []}
      />

      {/* Phase 2 — Comparatif + badges avant CTA final */}
      <CompetitorTable />
      <TrustBadges />

      {/* 9. CTA final (Phase 1) */}
      <CtaBanner />

      {/* 10. Footer */}
      <MarketingFooter />
    </div>
  );
}
