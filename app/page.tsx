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
  UsersRound,
  Shield,
  Sparkles,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { LandingHeroTrustStrip } from "@/components/landing/LandingHeroTrustStrip";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingWhyPilotys } from "@/components/landing/landing-why-pilotys";
import { LandingDemoPreview } from "@/components/landing/landing-demo-preview";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingBeforeAfter } from "@/components/landing/landing-before-after";
import { LandingTrustSection } from "@/components/landing/landing-trust-section";
import HeroBanner from "@/components/landing/HeroBanner";
import SocialProofBanner from "@/components/landing/SocialProofBanner";
import RoiSection from "@/components/landing/RoiSection";
import { LandingFeedbackSection } from "@/components/landing/LandingFeedbackSection";
import CtaBanner from "@/components/landing/CtaBanner";
import PersonasSection from "@/components/landing/PersonasSection";
import CompetitorTable from "@/components/landing/CompetitorTable";
import TrustBadges from "@/components/landing/TrustBadges";
import { LandingMobile } from "@/components/landing/landing-mobile";
import { LandingDesktopMeetingsMock } from "@/components/landing/LandingDesktopMeetingsMock";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-screen bg-slate-50/80">
      <AnchorScrollHandler />
      <LandingMobile />

      <div className="hidden md:block">
      <MarketingHeader />

      <HeroBanner />
      <LandingHeroTrustStrip />
      <SocialProofBanner />
      <LandingDesktopMeetingsMock />

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

      <RoiSection />
      <LandingFeedbackSection />

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
    </div>
  );
}
