// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";
// Forcer le rendu dynamique car le layout utilise cookies() via getLocaleFromRequest()
export const dynamic = "force-dynamic";
// Landing page marketing complète - déployée le 2025-01-27

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { AnchorScrollHandler } from "@/components/marketing/anchor-scroll-handler";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepRow } from "@/components/marketing/step-row";
import { UseCaseCard } from "@/components/marketing/use-case-card";
import { getTranslations } from "@/i18n/request";
import {
  CheckSquare2,
  Target,
  TrendingUp,
  FileText,
  Calendar,
  Map,
  ArrowRight,
  User,
  Users,
  Briefcase,
  Zap,
  AlertCircle,
  Eye,
  BarChart3,
  PieChart,
  KanbanSquare,
  Building2,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

export default async function LandingPage() {
  const t = await getTranslations("landing");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AnchorScrollHandler />
      <MarketingHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            {t("hero.title")}
            <br />
            <span className="text-blue-600">{t("hero.titleHighlight")}</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white px-8 py-6 text-lg">
                {t("hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
          </div>
          
          {/* Hero Visual - Mockup de l'interface */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
              {/* Mockup Header */}
              <div className="bg-slate-50 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">PILOTYS</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                </div>
              </div>
              
              {/* Mockup Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Card 1: Décisions */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{t("mockup.decisions")}</h3>
                        <p className="text-xs text-slate-500">{t("mockup.decisionsActive")}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-blue-200 rounded-full">
                        <div className="h-2 bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-xs text-slate-600">{t("mockup.decisionsDecided")}</p>
                    </div>
                  </div>
                  
                  {/* Card 2: Actions */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <CheckSquare2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{t("mockup.actions")}</h3>
                        <p className="text-xs text-slate-500">{t("mockup.actionsInProgress")}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-purple-200 rounded-full">
                        <div className="h-2 bg-purple-600 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                      <p className="text-xs text-slate-600">{t("mockup.actionsCompleted")}</p>
                    </div>
                  </div>
                  
                  {/* Card 3: Projets */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Map className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{t("mockup.projects")}</h3>
                        <p className="text-xs text-slate-500">{t("mockup.projectsActive")}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-emerald-200 rounded-full">
                        <div className="h-2 bg-emerald-600 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <p className="text-xs text-slate-600">{t("mockup.projectsAdvanced")}</p>
                    </div>
                  </div>
                </div>
                
                {/* Mockup Kanban */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 mb-4 text-sm">{t("mockup.kanbanBoard")}</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {[t("mockup.todo"), t("mockup.inProgress"), t("mockup.inReview"), t("mockup.done")].map((status, idx) => (
                      <div key={status} className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-slate-600">{status}</span>
                          <span className="text-xs text-slate-400">{idx + 2}</span>
                        </div>
                        <div className="space-y-2">
                          {[0, 1].map((i) => (
                            <div key={i} className="bg-slate-50 rounded p-2 border border-slate-100">
                              <div className="h-2 bg-slate-200 rounded mb-2"></div>
                              <div className="h-1 bg-slate-200 rounded w-2/3"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Visual Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
                {/* Dashboard Mockup */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-900">{t("mockup.dashboard")}</h3>
                      <div className="flex gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <PieChart className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    
                    {/* Mini Charts */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="h-16 flex items-end justify-between gap-1">
                          {[40, 60, 45, 80, 70, 90].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }}></div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 mt-2 text-center">{t("mockup.activity")}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-center">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-8 border-blue-500"></div>
                          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-500" style={{ transform: 'rotate(45deg)' }}></div>
                        </div>
                        <p className="text-xs text-slate-600 ml-2">{t("mockup.status")}</p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">12</div>
                        <div className="text-xs text-slate-600">{t("mockup.decisionsLabel")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">28</div>
                        <div className="text-xs text-slate-600">{t("mockup.actionsLabel")}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">5</div>
                        <div className="text-xs text-slate-600">{t("mockup.projectsLabel")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Description */}
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
                {t("showcase.title")}
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {t("showcase.subtitle")}
              </p>
              <div className="space-y-4">
                {[
                  { icon: BarChart3, title: t("showcase.visualDashboards.title"), desc: t("showcase.visualDashboards.description") },
                  { icon: KanbanSquare, title: t("showcase.kanbanView.title"), desc: t("showcase.kanbanView.description") },
                  { icon: TrendingUp, title: t("showcase.realtimeTracking.title"), desc: t("showcase.realtimeTracking.description") },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                      <p className="text-slate-600 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            {t("features.title")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Target}
            title={t("featureCards.structuredDecisions.title")}
            description={t("featureCards.structuredDecisions.description")}
            iconColor="blue"
          />
          <FeatureCard
            icon={CheckSquare2}
            title={t("featureCards.traceableActions.title")}
            description={t("featureCards.traceableActions.description")}
            iconColor="purple"
          />
          <FeatureCard
            icon={TrendingUp}
            title={t("featureCards.progressTracking.title")}
            description={t("featureCards.progressTracking.description")}
            iconColor="emerald"
          />
          <FeatureCard
            icon={FileText}
            title={t("featureCards.weeklyReview.title")}
            description={t("featureCards.weeklyReview.description")}
            iconColor="blue"
          />
          <FeatureCard
            icon={Calendar}
            title={t("featureCards.outlookIntegration.title")}
            description={t("featureCards.outlookIntegration.description")}
            iconColor="purple"
          />
          <FeatureCard
            icon={Map}
            title={t("featureCards.visualRoadmap.title")}
            description={t("featureCards.visualRoadmap.description")}
            iconColor="emerald"
          />
        </div>
      </section>

      {/* Workflow Section */}
      <section id="roadmap" className="container mx-auto px-6 py-24 bg-white rounded-3xl mx-6 mb-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            {t("workflow.title")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("workflow.subtitle")}
          </p>
        </div>
        <StepRow
          steps={[
            {
              icon: Users,
              title: t("workflowSteps.collaborate.title"),
              description: t("workflowSteps.collaborate.description"),
            },
            {
              icon: Calendar,
              title: t("workflowSteps.centralize.title"),
              description: t("workflowSteps.centralize.description"),
            },
            {
              icon: Sparkles,
              title: t("workflowSteps.decide.title"),
              description: t("workflowSteps.decide.description"),
            },
            {
              icon: BarChart3,
              title: t("workflowSteps.pilot.title"),
              description: t("workflowSteps.pilot.description"),
            },
          ]}
        />
      </section>

      {/* Collaboration Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <CollaborationSection hasCompany={false} isCompanyAdmin={false} />
        </div>
      </section>

      {/* Weekly Review Section */}
      <section id="weekly-review" className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
            {t("weeklyReview.title")}
          </h2>
          <p className="text-lg text-slate-600 mb-12 leading-relaxed">
            {t("weeklyReview.subtitle")}
          </p>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t("weeklyReviewDetails.reflection.title")}</h3>
                <p className="text-sm text-slate-600">{t("weeklyReviewDetails.reflection.description")}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t("weeklyReviewDetails.decisions.title")}</h3>
                <p className="text-sm text-slate-600">{t("weeklyReviewDetails.decisions.description")}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">{t("weeklyReviewDetails.planning.title")}</h3>
                <p className="text-sm text-slate-600">{t("weeklyReviewDetails.planning.description")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            {t("useCases.title")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("useCases.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UseCaseCard
            icon={User}
            title={t("useCases.freelancer.title")}
            description={t("useCases.freelancer.description")}
            benefits={t.raw("useCases.freelancer.benefits") || []}
            iconColor="blue"
          />
          <UseCaseCard
            icon={Users}
            title={t("useCases.manager.title")}
            description={t("useCases.manager.description")}
            benefits={t.raw("useCases.manager.benefits") || []}
            iconColor="purple"
          />
          <UseCaseCard
            icon={Briefcase}
            title={t("useCases.entrepreneur.title")}
            description={t("useCases.entrepreneur.description")}
            benefits={t.raw("useCases.entrepreneur.benefits") || []}
            iconColor="emerald"
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 md:p-16 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold">
              {t("cta.button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
