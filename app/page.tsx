// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";
// Forcer le rendu dynamique car le layout utilise cookies() via getLocaleFromRequest()
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepRow } from "@/components/marketing/step-row";
import { UseCaseCard } from "@/components/marketing/use-case-card";
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

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Transformez vos décisions
            <br />
            <span className="text-blue-600">en résultats concrets</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            PILOTYS vous aide à prendre de meilleures décisions, suivre vos actions et atteindre vos objectifs avec clarté et sérénité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white px-8 py-6 text-lg">
                Essayer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Fonctionnalités puissantes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour piloter vos décisions et actions efficacement
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Target}
            title="Décisions structurées"
            description="Organisez vos décisions avec contexte, risques et statuts. Suivez leur évolution de l'idée à l'action."
            iconColor="blue"
          />
          <FeatureCard
            icon={CheckSquare2}
            title="Actions traçables"
            description="Créez des actions liées à vos décisions. Assignez-les, suivez-les et validez-les facilement."
            iconColor="purple"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Suivi de progression"
            description="Visualisez l'avancement de vos projets et décisions avec des tableaux de bord clairs et intuitifs."
            iconColor="emerald"
          />
          <FeatureCard
            icon={FileText}
            title="Weekly Review"
            description="Réfléchissez sur votre semaine, identifiez les décisions à prendre et planifiez la suivante."
            iconColor="blue"
          />
          <FeatureCard
            icon={Calendar}
            title="Intégration Outlook"
            description="Synchronisez vos réunions et événements Microsoft Outlook directement dans PILOTYS."
            iconColor="purple"
          />
          <FeatureCard
            icon={Map}
            title="Roadmap visuelle"
            description="Planifiez vos projets avec des roadmaps claires et partageables avec votre équipe."
            iconColor="emerald"
          />
        </div>
      </section>

      {/* Workflow Section */}
      <section id="roadmap" className="container mx-auto px-6 py-24 bg-white rounded-3xl mx-6 mb-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Un processus simple en 4 étapes pour transformer vos décisions en résultats
          </p>
        </div>
        <StepRow
          steps={[
            {
              icon: AlertCircle,
              title: "Identifiez",
              description: "Repérez les décisions importantes à prendre dans votre quotidien professionnel.",
            },
            {
              icon: Target,
              title: "Décidez",
              description: "Structurez vos décisions avec contexte, risques et critères de validation.",
            },
            {
              icon: CheckSquare2,
              title: "Agissez",
              description: "Créez des actions concrètes liées à vos décisions et suivez leur exécution.",
            },
            {
              icon: TrendingUp,
              title: "Résultats",
              description: "Validez vos actions et mesurez l'impact de vos décisions sur vos objectifs.",
            },
          ]}
        />
      </section>

      {/* Weekly Review Section */}
      <section id="weekly-review" className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
            Weekly Review intégrée
          </h2>
          <p className="text-lg text-slate-600 mb-12 leading-relaxed">
            Chaque semaine, prenez le temps de réfléchir sur vos accomplissements, identifier les décisions à prendre et planifier la semaine suivante. Un rituel puissant pour améliorer votre productivité et votre clarté mentale.
          </p>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Réflexion</h3>
                <p className="text-sm text-slate-600">Analysez votre semaine écoulée et identifiez les points clés.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Décisions</h3>
                <p className="text-sm text-slate-600">Listez les décisions importantes à prendre pour la semaine suivante.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Planification</h3>
                <p className="text-sm text-slate-600">Créez vos actions et définissez vos priorités pour la semaine à venir.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Pour qui ?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            PILOTYS s'adapte à vos besoins, que vous soyez entrepreneur, manager ou professionnel autonome
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UseCaseCard
            icon={User}
            title="Professionnel autonome"
            description="Gérez vos décisions et actions sans complexité inutile."
            benefits={[
              "Suivi simple de vos décisions",
              "Actions claires et traçables",
              "Weekly Review personnalisée",
            ]}
            iconColor="blue"
          />
          <UseCaseCard
            icon={Users}
            title="Manager d'équipe"
            description="Pilotez les décisions de votre équipe et suivez leur exécution."
            benefits={[
              "Décisions partagées avec l'équipe",
              "Assignation d'actions",
              "Visibilité sur l'avancement",
            ]}
            iconColor="purple"
          />
          <UseCaseCard
            icon={Briefcase}
            title="Entrepreneur"
            description="Structurez vos décisions stratégiques et opérationnelles."
            benefits={[
              "Roadmap de projets",
              "Suivi des décisions critiques",
              "Intégration avec Outlook",
            ]}
            iconColor="emerald"
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 md:p-16 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à transformer vos décisions en résultats ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez PILOTYS et découvrez comment prendre de meilleures décisions et atteindre vos objectifs avec clarté.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-semibold">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
