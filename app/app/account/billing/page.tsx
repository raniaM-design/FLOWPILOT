import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { BillingPortalButton } from "@/components/billing-portal-button";
import Link from "next/link";

export default async function BillingPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // TODO: Récupérer l'historique des factures depuis Stripe
  const invoices: Array<{
    id: string;
    date: Date;
    amount: number;
    status: "paid" | "pending" | "failed";
    downloadUrl?: string;
  }> = [];

  return (
    <div className="bg-background min-h-screen">
      <div className="container max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facturation</h1>
            <p className="text-slate-600 mt-2">
              Consultez vos factures et votre historique de paiement.
            </p>
          </div>

          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Aucune facture
                </h3>
                <p className="text-slate-600 mb-4">
                  Vos factures apparaîtront ici une fois que vous aurez souscrit à un abonnement.
                </p>
                <Button asChild>
                  <a href="/app/account/subscription">Gérer l'abonnement</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Facture #{invoice.id.slice(-8)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {invoice.date.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {invoice.amount.toFixed(2)} €
                          </p>
                          <p className="text-sm text-slate-600 capitalize">{invoice.status}</p>
                        </div>
                        {invoice.downloadUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={invoice.downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Accès au portail de facturation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Pour télécharger vos factures ou mettre à jour votre méthode de paiement, 
                accédez au portail de gestion Stripe.
              </p>
              <BillingPortalButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

