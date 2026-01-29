import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepRow } from "@/components/marketing/step-row";
import { UseCaseCard } from "@/components/marketing/use-case-card";

// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";
// Forcer le rendu dynamique car le layout utilise cookies() via getLocaleFromRequest()
export const dynamic = "force-dynamic";
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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <MarketingHeader />

      {/* HERO Section - Impact émotionnel renforcé */}
      <section className="container mx-auto px-6 pt-16 pb-24 lg:pt-20 lg:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-sm font-medium text-blue-700">
                <Zap className="h-3.5 w-3.5" />
                Outil de pilotage de projets
              </div>
              
              {/* Problème AVANT - Plus concret */}
              <div className="space-y-4">
                <p className="text-lg font-medium text-slate-700">
                  Vous animez des réunions, mais...
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Les décisions prises se perdent dans les notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Vous ne savez plus qui doit faire quoi ni quand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Les retards s'accumulent sans visibilité</span>
                  </li>
                </ul>
              </div>

              {/* Solution - Plus concrète */}
              <div className="pt-4 border-t border-slate-200">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-4">
                  Transformez vos réunions en{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    décisions traçables
                  </span>{" "}
                  et actions suivies
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">PILOTYS transforme vos comptes rendus de réunions en décisions documentées et actions assignées.</span>{" "}
                  Vous savez qui fait quoi, quand, et ce qui bloque. 
                  <span className="font-medium text-slate-900"> Enfin, de la traçabilité.</span>
                </p>
                <p className="text-lg font-medium text-slate-900 mt-4">
                  Vos réunions importées deviennent enfin actionnables.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all w-full sm:w-auto">
                  Essayer PILOTYS
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 hover:bg-slate-50">
                  Se connecter
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-3">
              Fonctionne avec vos réunions existantes (Outlook).
            </p>

            {/* Chips - Plus concrets */}
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-sm font-medium text-blue-700">
                <FileText className="h-4 w-4" />
                Comptes rendus → Décisions traçables
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
                <CheckSquare2 className="h-4 w-4" />
                Actions assignées avec échéances
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-sm font-medium text-purple-700">
                <Calendar className="h-4 w-4" />
                Weekly Review exportable (PDF/PPT)
              </div>
            </div>
          </div>

          {/* Right: Product Mock */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xl shadow-blue-500/10 p-8 space-y-5 transform rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="h-3 w-28 bg-slate-900 rounded mb-1.5 font-semibold" />
                    <div className="h-2 w-20 bg-slate-400 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200">
                    3 en retard
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                    12 à faire
                  </span>
                </div>
              </div>
              
              {/* Progress bars */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Actions en retard</span>
                    <span className="font-bold text-red-600">3</span>
                  </div>
                  <div className="h-2.5 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full w-[15%] bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">À faire cette semaine</span>
                    <span className="font-bold text-blue-600">8</span>
                  </div>
                  <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full w-[40%] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Terminées</span>
                    <span className="font-bold text-emerald-600">24</span>
                  </div>
                  <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full w-[68%] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
                  </div>
                </div>
              </div>
              
              {/* Stats cards */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-xl border border-orange-200 p-3 flex flex-col justify-between">
                  <span className="text-xs font-medium text-orange-700">Décisions</span>
                  <span className="text-2xl font-bold text-orange-900">5</span>
                </div>
                <div className="h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-3 flex flex-col justify-between">
                  <span className="text-xs font-medium text-blue-700">Projets</span>
                  <span className="text-2xl font-bold text-blue-900">12</span>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 h-32 w-32 bg-blue-200/40 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-6 -left-6 h-40 w-40 bg-purple-200/40 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Section "Avant / Après" - Pourquoi PILOTYS */}
      <section id="features" className="bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 py-24">
        <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            De la réunion à l'action : un workflow clair
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            PILOTYS transforme vos comptes rendus de réunions en décisions documentées et actions suivies. 
            Pas de magie, juste de la traçabilité.
          </p>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={FileText}
              title="Comptes rendus → Décisions documentées"
              description="Rédigez ou ajoutez votre compte rendu de réunion. PILOTYS extrait les décisions et actions. Vous documentez chaque décision avec son contexte. Plus jamais de décisions perdues."
              iconColor="blue"
            />
            <FeatureCard
              icon={Target}
              title="Actions floues → Actions assignées et suivies"
              description="Chaque action a un responsable, une échéance et un statut (À faire, En cours, Terminé, Bloqué). Vous voyez immédiatement ce qui est en retard ou bloqué."
              iconColor="purple"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Surprises → Visibilité totale"
              description="Votre dashboard affiche les actions en retard, les priorités de la semaine, et les décisions à surveiller. Vous gardez le contrôle sans surprises."
              iconColor="emerald"
            />
          </div>
        </div>
      </section>

      {/* Section Dashboard - Avant/Après renforcé */}
      <section id="weekly-review" className="bg-white border-y border-slate-200/60 py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Mock Dashboard */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/60 shadow-xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-slate-200 rounded" />
                  <div className="h-8 w-24 bg-blue-600 rounded" />
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 w-full bg-red-50 border-l-4 border-red-500 rounded pl-4 py-2" />
                  <div className="h-4 w-5/6 bg-amber-50 border-l-4 border-amber-500 rounded pl-4 py-2" />
                  <div className="h-4 w-4/6 bg-blue-50 border-l-4 border-blue-500 rounded pl-4 py-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-gradient-to-br from-orange-50 to-rose-50 rounded-lg border border-orange-200" />
                  <div className="h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200" />
                </div>
              </div>
            </div>

            {/* Right: Features - Plus concrètes */}
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                Un dashboard qui montre l'essentiel
              </h2>
              <p className="text-lg text-slate-600">
                Actions en retard, priorités de la semaine, décisions à surveiller. Tout en un coup d'œil.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Actions en retard — identifiées immédiatement</h3>
                    <p className="text-slate-600 text-sm">Votre dashboard liste toutes les actions dont l'échéance est dépassée. Vous voyez le responsable, le projet concerné, et le nombre de jours de retard.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">À faire cette semaine — toujours visible</h3>
                    <p className="text-slate-600 text-sm">Les actions avec échéance dans les 7 prochains jours sont affichées en priorité. Vous savez exactement sur quoi vous concentrer.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 mt-0.5">
                    <FileText className="h-3 w-3 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Weekly Review — export PDF/PPT en un clic</h3>
                    <p className="text-slate-600 text-sm">Générez un récapitulatif hebdomadaire structuré avec vos décisions, actions, et statistiques. Exportez en PDF ou PPT pour partager avec votre équipe.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 mt-0.5">
                    <Calendar className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Réunions importées — point de départ réel</h3>
                    <p className="text-slate-600 text-sm">Vos réunions sont importées depuis Outlook. Vous travaillez à partir de votre agenda réel, pas d'un outil isolé.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section Outlook Integration - Nouvelle section */}
      <section className="bg-white border-y border-slate-200/60 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Vos réunions existent déjà. PILOTYS les transforme.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              PILOTYS s'appuie sur vos réunions importées pour structurer décisions et actions — sans double saisie, sans perte d'information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Calendar}
              title="Réunion importée"
              description="Connectez votre compte Outlook. Vos réunions sont automatiquement importées avec leur date, participants et contexte."
              iconColor="blue"
            />
            <FeatureCard
              icon={Target}
              title="Décisions & actions identifiées"
              description="Ajoutez votre compte rendu ou vos notes. PILOTYS identifie les décisions prises, les actions à suivre et les points à clarifier."
              iconColor="purple"
            />
            <FeatureCard
              icon={CheckSquare2}
              title="Suivi dans le temps"
              description="Les décisions et actions sont suivies dans le dashboard, les weekly reviews et les exports PDF/PPT. Rien ne se perd après la réunion."
              iconColor="emerald"
            />
          </div>
        </div>
      </section>

      {/* Section Workflow - Renforçant le contrôle */}
      <section id="roadmap" className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-24">
        <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Un workflow simple en 4 étapes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            De votre compte rendu de réunion à vos actions suivies
          </p>
        </div>

        <StepRow
          steps={[
            {
              icon: FileText,
              title: "1. Importez votre réunion ou ajoutez votre compte rendu",
              description: "Vos réunions importées depuis Outlook servent de base. Vous pouvez aussi ajouter un compte rendu existant.",
            },
            {
              icon: CheckSquare2,
              title: "2. Documentez les décisions",
              description: "Pour chaque décision, ajoutez le contexte, la raison, et les actions associées. Tout est tracé et consultable.",
            },
            {
              icon: Target,
              title: "3. Assignez les actions",
              description: "Attribuez chaque action à un responsable, définissez une échéance, et suivez le statut (À faire, En cours, Terminé, Bloqué).",
            },
            {
              icon: Calendar,
              title: "4. Suivez l'avancement",
              description: "Votre dashboard affiche les retards, les blocages et les priorités. Faites une Weekly Review et exportez en PDF/PPT pour partager avec votre équipe.",
            },
          ]}
        />
        </div>
      </section>

      {/* Section Use Cases - Renforçant le contrôle */}
      <section id="use-cases" className="bg-white border-y border-slate-200/60 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Pour qui est PILOTYS ?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Managers, chefs de projet, dirigeants qui prennent des décisions en réunion et veulent garder le contrôle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <UseCaseCard
              icon={Users}
              title="Manager d'équipe"
              description="Vous animez des réunions d'équipe et devez suivre les actions assignées. PILOTYS vous donne une vue claire de qui fait quoi et ce qui bloque."
              benefits={[
                "Suivi des actions d'équipe en temps réel",
                "Blocages identifiés immédiatement",
                "Weekly Review structurée pour vos points hebdomadaires",
              ]}
              iconColor="blue"
            />
            <UseCaseCard
              icon={Briefcase}
              title="Chef de projet"
              description="Vous pilotez plusieurs projets avec des décisions à prendre et des actions à suivre. PILOTYS vous aide à garder une traçabilité complète sur tous vos projets."
              benefits={[
                "Décisions documentées par projet",
                "Actions assignées avec échéances claires",
                "Roadmap automatique pour chaque projet",
              ]}
              iconColor="purple"
            />
            <UseCaseCard
              icon={User}
              title="Dirigeant / Fondateur"
              description="Vous prenez des décisions stratégiques et devez vous assurer qu'elles sont suivies. PILOTYS vous donne une visibilité totale sur l'exécution de vos décisions."
              benefits={[
                "Décisions stratégiques toujours tracées",
                "Actions assignées avec responsabilités claires",
                "Vue d'ensemble des priorités en temps réel",
              ]}
              iconColor="emerald"
            />
          </div>
        </div>
      </section>

      {/* CTA Final - Renforçant le contrôle */}
      <section className="container mx-auto px-6 py-24">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl border border-blue-800/30 shadow-2xl shadow-blue-900/20 p-12 lg:p-16 text-center overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-blue-400/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 h-64 w-64 bg-indigo-400/20 rounded-full blur-3xl -z-10" />
          
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4 relative z-10">
            Prêt à transformer vos réunions importées en actions suivies ?
          </h2>
          <p className="text-lg text-blue-50 mb-4 max-w-2xl mx-auto relative z-10">
            Rejoignez PILOTYS et gardez le contrôle de vos décisions et actions. 
            <span className="font-semibold text-white"> Sans surprises, avec de la traçabilité.</span>
          </p>
          <p className="text-base text-blue-100/90 mb-10 max-w-2xl mx-auto relative z-10">
            Sans double saisie. Sans perte d'information. Avec une traçabilité complète.
          </p>
          <div className="space-y-3 relative z-10">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl shadow-blue-900/30 hover:shadow-2xl hover:shadow-blue-900/40 transition-all font-semibold">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-blue-100/80">
              Sans carte bancaire • Essai gratuit
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
