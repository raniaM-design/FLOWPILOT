import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Check, ArrowRight, HelpCircle } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <MarketingHeader />

      {/* Hero Pricing */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Tarifs simples et transparents
          </h1>
          <p className="text-xl text-slate-600">
            30 jours d'essai gratuit, sans carte bancaire. Puis 12 € par mois et par utilisateur.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Carte Essai gratuit */}
          <Card className="border-2 border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Essai gratuit</CardTitle>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">0 €</span>
                </div>
                <CardDescription className="text-base">30 jours</CardDescription>
              </div>
              <p className="text-slate-600 mt-4">
                Testez PILOTYS pendant 30 jours sans engagement. Aucune carte bancaire requise.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Rédaction ou ajout de comptes rendus de réunion</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Décisions documentées</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Actions assignées (responsable, échéance, statut)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Dashboard de suivi</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Weekly Review</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Monthly Review</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Exports PDF / PPT</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button size="lg" className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
                  Commencer l'essai gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Carte Pro */}
          <Card className="border-2 border-blue-500 bg-white relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-semibold">
                Recommandé
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Pro</CardTitle>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">12 €</span>
                  <span className="text-slate-600">/ mois</span>
                </div>
                <CardDescription className="text-base">par utilisateur</CardDescription>
                <div className="pt-2">
                  <p className="text-sm text-slate-600">
                    ou <span className="font-semibold text-slate-900">120 € par an</span>{" "}
                    <span className="text-emerald-600 font-medium">(2 mois offerts)</span>
                  </p>
                </div>
              </div>
              <p className="text-slate-600 mt-4">
                Accès complet à toutes les fonctionnalités de PILOTYS pour votre équipe.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Toutes les fonctionnalités de l'essai gratuit</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Gestion multi-projets illimitée</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Exports PDF / PPT illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Support prioritaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Mises à jour régulières</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Link href="/signup" className="w-full">
                <Button size="lg" className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
                  Choisir Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Bloc de réassurance */}
      <section className="container mx-auto px-6 pb-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Sans engagement, sans surprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Essai gratuit de 30 jours, sans carte bancaire</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Résiliation possible à tout moment</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Pas de frais cachés</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Facturation mensuelle ou annuelle au choix</span>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Support inclus dans tous les plans</span>
              </div>
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-slate-600">
              Vous pouvez résilier votre abonnement à tout moment depuis votre compte. 
              La résiliation prend effet à la fin de la période en cours.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            {/* Question 1 */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Puis-je essayer PILOTYS gratuitement ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Oui. Vous bénéficiez d'un essai gratuit de 30 jours, sans carte bancaire. 
                  Vous avez accès à toutes les fonctionnalités pendant cette période.
                </p>
              </CardContent>
            </Card>

            {/* Question 2 */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Comment fonctionne la facturation ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Vous pouvez choisir entre un paiement mensuel (12 € / mois / utilisateur) 
                  ou annuel (120 € / an / utilisateur, soit 2 mois offerts). 
                  La facturation se fait par utilisateur actif.
                </p>
              </CardContent>
            </Card>

            {/* Question 3 */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Puis-je changer de plan ou résilier à tout moment ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Oui. Vous pouvez modifier votre plan ou résilier votre abonnement à tout moment 
                  depuis votre compte. La résiliation prend effet à la fin de la période en cours, 
                  sans interruption du service pendant cette période.
                </p>
              </CardContent>
            </Card>

            {/* Question 4 */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Que se passe-t-il après l'essai gratuit ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  À la fin des 30 jours d'essai, vous pouvez choisir de continuer avec le plan Pro 
                  (12 € / mois / utilisateur) ou arrêter sans frais. 
                  Aucune facturation automatique n'est effectuée sans votre accord.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-6 pb-24">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl border border-blue-800/30 shadow-2xl shadow-blue-900/20 p-12 lg:p-16 text-center overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 right-0 h-64 w-64 bg-blue-400/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 h-64 w-64 bg-indigo-400/20 rounded-full blur-3xl -z-10" />
          
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4 relative z-10">
            Prêt à transformer vos réunions en actions suivies ?
          </h2>
          <p className="text-lg text-blue-50 mb-10 max-w-2xl mx-auto relative z-10">
            Commencez votre essai gratuit de 30 jours, sans carte bancaire.
          </p>
          <div className="space-y-3 relative z-10">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl shadow-blue-900/30 hover:shadow-2xl hover:shadow-blue-900/40 transition-all font-semibold">
                Commencer l'essai gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-blue-100/80">
              Sans engagement • Résiliation possible à tout moment
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

