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
      <section className="container mx-auto px-4 md:px-6 pt-20 pb-12 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 md:mb-8 leading-[1.1]">
            {t("hero.title")}
            <br />
            <span className="text-blue-600">{t("hero.titleHighlight")}</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
            <Link href="/signup">
              <Button size="lg" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                {t("hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-medium border-2">
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
          </div>
          <p className="text-sm md:text-base text-slate-600 mb-12 font-medium">
            {t("hero.ctaMicroCopy")}
          </p>
          
          {/* Hero Visual - Mockup de l'interface */}
          <div className="mt-8 md:mt-16 relative px-1 md:px-0">
            <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200/60 shadow-xl md:shadow-2xl overflow-hidden">
              {/* Mockup Header */}
              <div className="bg-slate-50 border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-900 text-sm md:text-base">PILOTYS</span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></div>
                </div>
              </div>
              
              {/* Mockup Content */}
              <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                  {/* Card 1: Décisions */}
                  <div className="bg-white border border-slate-200 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{t("mockup.decisions")}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{t("mockup.decisionsActive")}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="h-1.5 md:h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-600">{t("mockup.decisionsDecided")}</p>
                    </div>
                  </div>
                  
                  {/* Card 2: Actions */}
                  <div className="bg-white border border-slate-200 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <CheckSquare2 className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{t("mockup.actions")}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{t("mockup.actionsInProgress")}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="h-1.5 md:h-2 bg-purple-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-600">{t("mockup.actionsCompleted")}</p>
                    </div>
                  </div>
                  
                  {/* Card 3: Projets */}
                  <div className="bg-white border border-slate-200 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Map className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{t("mockup.projects")}</h3>
                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{t("mockup.projectsActive")}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="h-1.5 md:h-2 bg-emerald-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-600">{t("mockup.projectsAdvanced")}</p>
                    </div>
                  </div>
                </div>
                
                {/* Mockup Kanban - Mobile: scroll horizontal snap | Desktop: grid 4 cols */}
                <div className="bg-slate-50 rounded-lg md:rounded-xl p-4 md:p-6">
                  <h4 className="font-semibold text-slate-900 mb-3 md:mb-4 text-xs md:text-sm">{t("mockup.kanbanBoard")}</h4>
                  <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-1 md:pb-0 snap-x snap-mandatory md:snap-none [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {[t("mockup.todo"), t("mockup.inProgress"), t("mockup.inReview"), t("mockup.done")].map((status, idx) => (
                      <div
                        key={status}
                        className="flex-shrink-0 w-[140px] md:w-auto snap-center md:snap-align-none bg-white rounded-lg p-3 md:p-4 border border-slate-200 shadow-sm md:shadow-none"
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <span className="text-[10px] md:text-xs font-medium text-slate-600 line-clamp-1">{status}</span>
                          <span className="text-[10px] md:text-xs text-slate-400 flex-shrink-0 ml-1">{idx + 2}</span>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                          {[0, 1].map((i) => (
                            <div key={i} className="bg-slate-50 rounded p-1.5 md:p-2 border border-slate-100">
                              <div className="h-1.5 md:h-2 bg-slate-200 rounded mb-1.5 md:mb-2"></div>
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

      {/* Intro Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-normal">
            {t("intro.text")}
          </p>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="container mx-auto px-6 py-24 bg-white rounded-3xl mx-6 mb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tighter text-slate-900 mb-5 leading-tight px-4">
              {t("problemSolution.title")}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              {t("problemSolution.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Before PILOTYS */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-bold text-red-900 mb-8 flex items-center gap-3">
                <AlertCircle className="h-7 w-7 flex-shrink-0" />
                {t("problemSolution.before.title")}
              </h3>
              <ul className="space-y-5">
                {t.raw("problemSolution.before.points")?.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-4 text-slate-800">
                    <span className="text-red-600 mt-1 text-lg font-bold flex-shrink-0">❌</span>
                    <span className="text-base leading-relaxed font-medium break-words">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* With PILOTYS */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-bold text-emerald-900 mb-8 flex items-center gap-3">
                <CheckSquare2 className="h-7 w-7 flex-shrink-0" />
                {t("problemSolution.after.title")}
              </h3>
              <ul className="space-y-5">
                {t.raw("problemSolution.after.points")?.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-4 text-slate-800">
                    <span className="text-emerald-600 mt-1 text-lg font-bold flex-shrink-0">✅</span>
                    <span className="text-base leading-relaxed font-medium break-words">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Visual Mockup - Dashboard (ordre 2 sur mobile = après le texte) */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200/60 shadow-lg md:shadow-xl overflow-hidden">
                {/* Dashboard Mockup */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
                  <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">{t("mockup.dashboard")}</h3>
                      <div className="flex gap-1.5 md:gap-2">
                        <div className="p-1.5 md:p-0 md:w-5 md:h-5 rounded-md bg-blue-100 md:bg-transparent">
                          <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                        </div>
                        <div className="p-1.5 md:p-0 md:w-5 md:h-5 rounded-md bg-purple-100 md:bg-transparent">
                          <PieChart className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Mini Charts */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="bg-slate-50 rounded-lg p-3 md:p-4">
                        <div className="h-12 md:h-16 flex items-end justify-between gap-0.5 md:gap-1">
                          {[40, 60, 45, 80, 70, 90].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-500 rounded-t min-w-0" style={{ height: `${h}%` }}></div>
                          ))}
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-600 mt-1.5 md:mt-2 text-center">{t("mockup.activity")}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 md:p-4 flex flex-col items-center justify-center">
                        <div className="relative w-12 h-12 md:w-16 md:h-16">
                          <div className="absolute inset-0 rounded-full border-4 md:border-8 border-blue-500"></div>
                          <div className="absolute inset-0 rounded-full border-4 md:border-8 border-transparent border-t-purple-500" style={{ transform: 'rotate(45deg)' }}></div>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-600 mt-1.5 md:ml-2 md:mt-0">{t("mockup.status")}</p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      <div className="text-center py-2 md:py-0 bg-slate-50/80 md:bg-transparent rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-blue-600">12</div>
                        <div className="text-[10px] md:text-xs text-slate-600">{t("mockup.decisionsLabel")}</div>
                      </div>
                      <div className="text-center py-2 md:py-0 bg-slate-50/80 md:bg-transparent rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-purple-600">28</div>
                        <div className="text-[10px] md:text-xs text-slate-600">{t("mockup.actionsLabel")}</div>
                      </div>
                      <div className="text-center py-2 md:py-0 bg-slate-50/80 md:bg-transparent rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-emerald-600">5</div>
                        <div className="text-[10px] md:text-xs text-slate-600">{t("mockup.projectsLabel")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Décoration mobile */}
              <div className="absolute -z-10 -top-3 -right-3 w-20 h-20 md:w-24 md:h-24 bg-blue-200/30 rounded-2xl blur-2xl"></div>
              <div className="absolute -z-10 -bottom-3 -left-3 w-16 h-16 md:w-20 md:h-20 bg-purple-200/30 rounded-2xl blur-2xl"></div>
            </div>
            
            {/* Right: Description (ordre 1 sur mobile = affiché en premier) */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 md:mb-6 leading-tight">
                {t("showcase.title")}
              </h2>
              <p className="text-base md:text-xl text-slate-600 mb-6 md:mb-10 leading-relaxed font-medium">
                {t("showcase.subtitle")}
              </p>
              <div className="space-y-4 md:space-y-6">
                {[
                  { icon: BarChart3, title: t("showcase.visualDashboards.title"), desc: t("showcase.visualDashboards.description") },
                  { icon: KanbanSquare, title: t("showcase.kanbanView.title"), desc: t("showcase.kanbanView.description") },
                  { icon: TrendingUp, title: t("showcase.realtimeTracking.title"), desc: t("showcase.realtimeTracking.description") },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4 md:gap-5">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1 md:mb-2 leading-tight">{feature.title}</h3>
                      <p className="text-sm md:text-base text-slate-600 leading-relaxed">{feature.desc}</p>
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
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {t("features.title")}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
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
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {t("workflow.title")}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            {t("workflow.subtitle")}
          </p>
        </div>
        <StepRow
          steps={[
            {
              icon: Calendar,
              title: t("workflowSteps.step1.title"),
              description: t("workflowSteps.step1.description"),
            },
            {
              icon: Sparkles,
              title: t("workflowSteps.step2.title"),
              description: t("workflowSteps.step2.description"),
            },
            {
              icon: CheckSquare2,
              title: t("workflowSteps.step3.title"),
              description: t("workflowSteps.step3.description"),
            },
            {
              icon: BarChart3,
              title: t("workflowSteps.step4.title"),
              description: t("workflowSteps.step4.description"),
            },
          ]}
        />
      </section>


      {/* Weekly & Monthly Review Section */}
      <section id="weekly-review" className="container mx-auto px-6 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Weekly Review */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                {t("weeklyReview.title")}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed font-medium max-w-3xl mx-auto">
                {t("weeklyReview.subtitle")}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{t("weeklyReviewDetails.reflection.title")}</h3>
                  <p className="text-base text-slate-600 leading-relaxed">{t("weeklyReviewDetails.reflection.description")}</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{t("weeklyReviewDetails.decisions.title")}</h3>
                  <p className="text-base text-slate-600 leading-relaxed">{t("weeklyReviewDetails.decisions.description")}</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{t("weeklyReviewDetails.planning.title")}</h3>
                  <p className="text-base text-slate-600 leading-relaxed">{t("weeklyReviewDetails.planning.description")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Review */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                {t("monthlyReview.title")}
              </h2>
              <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed font-medium max-w-3xl mx-auto">
                {t("monthlyReview.subtitle")}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-slate-200/60 shadow-sm p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{t("monthlyReview.features.bilan.title")}</h3>
                      <p className="text-base text-slate-600 leading-relaxed">{t("monthlyReview.features.bilan.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{t("monthlyReview.features.tendances.title")}</h3>
                      <p className="text-base text-slate-600 leading-relaxed">{t("monthlyReview.features.tendances.description")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{t("monthlyReview.visuals.title")}</h3>
                      <p className="text-base text-slate-600 leading-relaxed">{t("monthlyReview.visuals.description")}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t("monthlyReview.features.rapport.title")}</p>
                          <p className="text-xs text-slate-500">{t("monthlyReview.features.rapport.format")}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">12</div>
                        <div className="text-xs text-slate-600">{t("monthlyReview.features.stats.decisions")}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">28</div>
                        <div className="text-xs text-slate-600">{t("monthlyReview.features.stats.actions")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="container mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {t("useCases.title")}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            {t("useCases.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <UseCaseCard
            icon={User}
            title={t("useCases.freelancer.title")}
            description={t("useCases.freelancer.description")}
            benefits={t.raw("useCases.freelancer.benefits") || []}
            iconColor="blue"
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 md:p-16 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            {t("cta.title")}
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            {t("cta.subtitle")}
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all">
              {t("cta.button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-base md:text-lg text-blue-100 mt-5 font-medium">
            {t("cta.microCopy")}
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
