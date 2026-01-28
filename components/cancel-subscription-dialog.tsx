"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, CheckCircle2 } from "lucide-react";

interface SubscriptionInfo {
  plan: "trial" | "pro" | "pro_annual" | "cancelled";
  status: "active" | "cancelled" | "expired";
  currentPeriodEnd?: string | Date; // Accepte string (ISO) ou Date
  cancelAtPeriodEnd?: boolean;
}

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionInfo;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
}: CancelSubscriptionDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatDate = (date?: string | Date) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPlanLabel = () => {
    if (subscription.plan === "pro_annual") {
      return "Pro (Annuel)";
    }
    return "Pro";
  };

  const getAmount = () => {
    if (subscription.plan === "pro_annual") {
      return "120 € / an";
    }
    return "12 € / mois";
  };

  const currentPeriodEnd = subscription.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : "...";

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      // Appel API pour annuler l'abonnement
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'annulation");
      }

      setIsSuccess(true);
      // Recharger la page après 2 secondes pour mettre à jour l'état
      setTimeout(() => {
        router.refresh();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-emerald-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">
              Votre abonnement a été annulé
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2">
              <p>
                Votre accès reste actif jusqu'au <strong>{currentPeriodEnd}</strong>.
              </p>
              <p className="text-sm text-slate-500">
                Vous recevrez un email de confirmation sous peu.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => onOpenChange(false)} className="w-full">
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler votre abonnement ?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <p>Vous êtes sur le point d'annuler votre abonnement Pro.</p>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Plan actuel</span>
                <span className="text-sm font-semibold text-foreground">{getPlanLabel()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Accès jusqu'au
                </span>
                <span className="text-sm font-semibold text-foreground">{currentPeriodEnd}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Montant
                </span>
                <span className="text-sm font-semibold text-foreground">{getAmount()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-foreground">Après l'annulation :</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                <li>Votre accès reste actif jusqu'au {currentPeriodEnd}</li>
                <li>Vous pourrez continuer à utiliser PILOTYS jusqu'à cette date</li>
                <li>Aucune facturation supplémentaire ne sera effectuée</li>
                <li>Vos données seront conservées pendant 30 jours après la fin d'accès</li>
              </ul>
            </div>

            <p className="text-sm text-slate-600 pt-2">
              Vous pourrez réactiver votre abonnement à tout moment depuis votre compte.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto">
            Conserver mon abonnement
          </AlertDialogCancel>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isLoading ? "Annulation..." : "Oui, annuler l'abonnement"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

