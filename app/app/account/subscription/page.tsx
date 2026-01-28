import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, Calendar, CreditCard, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BillingPortalButton } from "@/components/billing-portal-button";

export default async function SubscriptionPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // TODO: Récupérer les informations d'abonnement depuis Stripe/DB
  // Pour l'instant, valeurs par défaut
  type SubscriptionPlan = "trial" | "pro" | "pro_annual" | "cancelled";
  type SubscriptionStatus = "active" | "cancelled" | "expired";
  
  const subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
  } = {
    plan: "trial",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPlanLabel = () => {
    if (subscription.plan === "pro_annual") {
      return "Pro (Annuel)";
    }
    if (subscription.plan === "pro") {
      return "Pro";
    }
    return "Essai gratuit";
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gérer l'abonnement</h1>
            <p className="text-slate-600 mt-2">
              Gérez votre abonnement, votre facturation et vos préférences.
            </p>
          </div>

          {/* Plan actuel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan actuel</CardTitle>
                <Badge variant={subscription.plan === "trial" ? "secondary" : "default"}>
                  {getPlanLabel()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {subscription.plan === "trial" ? "Expire le" : "Renouvelle le"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
                {subscription.plan !== "trial" && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Montant</p>
                      <p className="text-sm text-slate-600">
                        {subscription.plan === "pro_annual" ? "120 € / an" : "12 € / mois"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Statut</p>
                    <p className="text-sm text-slate-600 capitalize">{subscription.status}</p>
                  </div>
                </div>
              </div>

              {subscription.plan === "trial" && (
                <div className="pt-4 border-t">
                  <Link href="/pricing">
                    <Button className="w-full sm:w-auto">
                      Passer au plan Pro
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gérer l'abonnement
                </CardTitle>
                <CardDescription>
                  Modifiez votre plan, mettez à jour votre méthode de paiement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BillingPortalButton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Facturation
                </CardTitle>
                <CardDescription>
                  Consultez vos factures et votre historique de paiement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/app/account/billing">
                  <Button variant="outline" className="w-full">
                    Voir les factures
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Informations */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Pour toute question concernant votre abonnement ou la facturation, 
                contactez-nous à{" "}
                <a href="mailto:billing@pilotys.io" className="text-blue-600 hover:underline">
                  billing@pilotys.io
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

