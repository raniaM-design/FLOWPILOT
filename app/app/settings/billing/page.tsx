import { redirect } from "next/navigation";
import { getCurrentUserIdOrThrow } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building2, FileText, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { BillingInfoForm } from "./billing-info-form";

export default async function BillingPage() {
  const userId = await getCurrentUserIdOrThrow();

  // Récupérer les informations de facturation
  const billingInfo = await prisma.billingInfo.findUnique({
    where: { userId },
  });

  // Récupérer les informations utilisateur pour le plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      createdAt: true,
    },
  });

  // TODO: Récupérer les informations d'abonnement depuis Stripe/DB
  // Pour l'instant, valeurs par défaut
  type SubscriptionPlan = "trial" | "pro" | "pro_annual" | "cancelled";
  type SubscriptionStatus = "active" | "cancelled" | "expired";
  
  const subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  } = {
    plan: "trial",
    status: "active",
    currentPeriodEnd: user?.createdAt ? new Date(new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000) : undefined,
    cancelAtPeriodEnd: false,
  };

  const getPlanDisplay = () => {
    if (!subscription) {
      return { label: "Essai gratuit", badge: "trial" };
    }

    if (subscription.status === "cancelled" || subscription.cancelAtPeriodEnd) {
      return { label: "Pro", badge: "cancelled" };
    }

    if (subscription.plan === "pro_annual") {
      return { label: "Pro (Annuel)", badge: "pro" };
    }

    return { label: "Pro", badge: "pro" };
  };

  const planDisplay = getPlanDisplay();

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Facturation</h1>
        <p className="text-slate-600">Gérez votre abonnement et vos coordonnées de facturation</p>
      </div>

      <div className="grid gap-6">
        {/* Plan actuel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Plan actuel
                </CardTitle>
                <CardDescription>Votre abonnement actuel</CardDescription>
              </div>
              {planDisplay.badge === "cancelled" && (
                <Badge variant="destructive">Annulé</Badge>
              )}
              {planDisplay.badge === "pro" && (
                <Badge className="bg-blue-100 text-blue-700">Pro</Badge>
              )}
              {planDisplay.badge === "trial" && (
                <Badge variant="outline">Essai gratuit</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">{planDisplay.label}</p>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-slate-600 mt-1">
                  {subscription.status === "cancelled" || subscription.cancelAtPeriodEnd
                    ? `Expire le ${subscription.currentPeriodEnd.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}`
                    : `Renouvelle le ${subscription.currentPeriodEnd.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}`}
                </p>
              )}
            </div>
            <Button disabled className="w-full sm:w-auto">
              Gérer l'abonnement
              <span className="ml-2 text-xs opacity-70">(Bientôt disponible)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Coordonnées de facturation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Coordonnées de facturation
            </CardTitle>
            <CardDescription>
              Informations utilisées pour la facturation et les factures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingInfoForm initialData={billingInfo} />
          </CardContent>
        </Card>

        {/* Factures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Factures
            </CardTitle>
            <CardDescription>Historique de vos factures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Aucune facture</p>
              <p className="text-xs text-slate-400 mt-1">
                Vos factures apparaîtront ici une fois votre abonnement activé
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

