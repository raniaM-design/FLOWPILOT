import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import {
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  CreditCard,
  Users,
  Zap,
  Shield,
  MessageCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ - Questions fréquentes | PILOTYS",
  description: "Trouvez les réponses à vos questions sur PILOTYS : fonctionnalités, tarifs, utilisation, et plus encore.",
};

interface FAQItem {
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

const faqCategories = [
  {
    title: "Général",
    icon: HelpCircle,
    questions: [
      {
        question: "Qu'est-ce que PILOTYS ?",
        answer: "PILOTYS est une plateforme de gestion de projets qui vous aide à reprendre le contrôle de vos décisions. Elle vous permet de créer des projets, documenter vos décisions importantes, suivre vos actions et tâches, organiser vos réunions, et extraire automatiquement les décisions et actions depuis vos comptes rendus de réunion.",
      },
      {
        question: "Comment PILOTYS diffère-t-il des autres outils de gestion de projet ?",
        answer: "PILOTYS se concentre sur la documentation des décisions et leur suivi. Contrairement aux outils classiques qui se concentrent sur les tâches, PILOTYS met l'accent sur la traçabilité des choix importants, l'analyse automatique des réunions, et la transformation des discussions en actions concrètes. C'est l'outil idéal pour les équipes qui veulent éviter de perdre le fil de leurs décisions.",
      },
      {
        question: "Puis-je utiliser PILOTYS seul ou en équipe ?",
        answer: "PILOTYS fonctionne parfaitement pour un usage individuel, mais brille vraiment en équipe. Vous pouvez créer ou rejoindre une entreprise, partager des projets avec votre équipe, assigner des actions à différents membres, et collaborer sur les décisions. Les fonctionnalités de collaboration sont incluses dans tous les plans.",
      },
    ],
  },
  {
    title: "Fonctionnalités",
    icon: Zap,
    questions: [
      {
        question: "Comment fonctionne l'analyse automatique des réunions ?",
        answer: "Collez simplement votre compte rendu de réunion dans PILOTYS. Notre système d'analyse IA extrait automatiquement : les décisions prises, les actions à réaliser avec leurs responsables et échéances, et les points à clarifier. Les résultats peuvent être directement ajoutés à votre projet. Cette fonctionnalité vous fait gagner du temps et garantit que rien n'est oublié.",
      },
      {
        question: "Puis-je exporter mes données ?",
        answer: "Oui ! PILOTYS vous permet d'exporter vos projets, décisions et actions en PDF ou PowerPoint. Vous pouvez générer des rapports pour vos présentations ou partager vos données avec des personnes externes à la plateforme.",
      },
      {
        question: "Comment fonctionne le système de priorités ?",
        answer: "Dans PILOTYS, vous pouvez définir des niveaux de priorité pour vos actions. Le dashboard affiche vos actions prioritaires du jour et de la semaine. Les actions urgentes sont mises en évidence pour ne pas être oubliées. Vous pouvez filtrer et trier les actions par priorité.",
      },
      {
        question: "Puis-je intégrer PILOTYS avec d'autres outils ?",
        answer: "Actuellement, PILOTYS propose une intégration avec Microsoft Outlook pour synchroniser votre calendrier et vos réunions. D'autres intégrations sont en développement. Si vous avez besoin d'une intégration spécifique, n'hésitez pas à nous contacter.",
      },
    ],
  },
  {
    title: "Tarifs et Abonnements",
    icon: CreditCard,
    questions: [
      {
        question: "Puis-je essayer PILOTYS gratuitement ?",
        answer: "Oui ! Vous bénéficiez d'un essai gratuit de 30 jours, sans carte bancaire. Vous avez accès à toutes les fonctionnalités pendant cette période, y compris l'analyse automatique des réunions, les exports, et la collaboration en équipe.",
      },
      {
        question: "Comment fonctionne la facturation ?",
        answer: "Vous pouvez choisir entre un paiement mensuel (12 € / mois / utilisateur) ou annuel (120 € / an / utilisateur, soit 2 mois offerts). La facturation se fait par utilisateur actif. Vous ne payez que pour les membres de votre équipe qui utilisent activement PILOTYS.",
      },
      {
        question: "Puis-je changer de plan ou résilier à tout moment ?",
        answer: "Absolument. Vous pouvez modifier votre plan ou résilier votre abonnement à tout moment depuis votre compte. La résiliation prend effet à la fin de la période en cours, sans interruption du service pendant cette période. Aucune facturation automatique n'est effectuée sans votre accord.",
      },
      {
        question: "Que se passe-t-il après l'essai gratuit ?",
        answer: "À la fin des 30 jours d'essai, vous pouvez choisir de continuer avec le plan Pro (12 € / mois / utilisateur) ou arrêter sans frais. Vous recevrez un rappel avant la fin de votre essai pour vous permettre de prendre une décision éclairée.",
      },
      {
        question: "Y a-t-il des frais cachés ?",
        answer: "Non, aucun frais caché. Le prix affiché est le prix que vous payez. Toutes les fonctionnalités sont incluses dans votre abonnement, sans limitation sur le nombre de projets, décisions, actions ou réunions.",
      },
    ],
  },
  {
    title: "Sécurité et Confidentialité",
    icon: Shield,
    questions: [
      {
        question: "Mes données sont-elles sécurisées ?",
        answer: "Absolument. La sécurité de vos données est notre priorité. Nous utilisons un chiffrement SSL/TLS pour toutes les communications, et vos données sont stockées de manière sécurisée. Nous respectons le RGPD et ne partageons jamais vos données avec des tiers.",
      },
      {
        question: "Puis-je supprimer mes données ?",
        answer: "Oui, vous pouvez supprimer vos données à tout moment depuis votre compte. Vous avez également la possibilité d'exporter toutes vos données avant de supprimer votre compte. Pour plus d'informations, consultez notre politique de confidentialité.",
      },
      {
        question: "Qui peut voir mes projets et décisions ?",
        answer: "Par défaut, vos projets sont privés et visibles uniquement par vous. Si vous créez ou rejoignez une entreprise, vous pouvez choisir de partager des projets avec votre équipe. Vous gardez toujours le contrôle sur qui peut voir quoi.",
      },
    ],
  },
  {
    title: "Support et Aide",
    icon: MessageCircle,
    questions: [
      {
        question: "Comment puis-je obtenir de l'aide ?",
        answer: "Plusieurs options s'offrent à vous : utilisez le chatbot en bas à droite de l'écran pour des questions rapides, consultez cette FAQ, ou contactez-nous par email à contact@pilotys.com. Nous répondons généralement dans les 24 heures.",
      },
      {
        question: "Y a-t-il une documentation ou des tutoriels ?",
        answer: "Le chatbot intégré dans PILOTYS peut répondre à la plupart de vos questions sur l'utilisation de la plateforme. Il vous guide étape par étape pour créer des projets, des décisions, des actions, et utiliser toutes les fonctionnalités. N'hésitez pas à lui poser vos questions !",
      },
      {
        question: "Proposez-vous une formation pour les équipes ?",
        answer: "Pour les équipes de plus de 10 utilisateurs, nous proposons des sessions de formation personnalisées. Contactez-nous à contact@pilotys.com pour discuter de vos besoins spécifiques.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Questions fréquentes
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Trouvez rapidement les réponses à vos questions sur PILOTYS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
                Essayer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="mailto:contact@pilotys.com">
              <Button size="lg" variant="outline">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="container mx-auto px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <div key={category.title} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{category.title}</h2>
                </div>
                <div className="space-y-4">
                  {category.questions.map((item, index) => (
                    <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900 flex items-start gap-2">
                          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{item.question}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-white" />
              <h2 className="text-3xl font-bold mb-4">
                Vous ne trouvez pas la réponse à votre question ?
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="mailto:contact@pilotys.com">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    Nous contacter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Essayer gratuitement
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

