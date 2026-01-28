"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Settings,
  FileText,
  X,
  LogOut,
  CreditCard,
  RotateCcw,
  Palette,
} from "lucide-react";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";

interface SubscriptionInfo {
  plan: "trial" | "pro" | "pro_annual" | "cancelled";
  status: "active" | "cancelled" | "expired";
  currentPeriodEnd?: string | Date; // Accepte string (ISO) ou Date
  cancelAtPeriodEnd?: boolean;
}

interface UserMenuProps {
  userEmail: string;
  subscription?: SubscriptionInfo;
}

export function UserMenu({ userEmail, subscription }: UserMenuProps) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Déterminer l'affichage du plan
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
  const initials = userEmail
    .split("@")[0]
    .split(".")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (date?: string | Date) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPlanDateText = () => {
    if (!subscription) {
      // Essai gratuit - calculer la date d'expiration (30 jours après création)
      return "Expire le ...";
    }

    if (subscription.status === "cancelled" || subscription.cancelAtPeriodEnd) {
      return subscription.currentPeriodEnd
        ? `Expire le ${formatDate(subscription.currentPeriodEnd)}`
        : "Expire le ...";
    }

    return subscription.currentPeriodEnd
      ? `Renouvelle le ${formatDate(subscription.currentPeriodEnd)}`
      : "Renouvelle le ...";
  };

  const handleManageSubscription = async () => {
    // Rediriger vers le Customer Portal Stripe
    // Pour l'instant, rediriger vers une page de gestion
    router.push("/app/account/subscription");
  };

  const handleBilling = async () => {
    // Rediriger vers le Customer Portal Stripe (section factures)
    router.push("/app/account/billing");
  };

  const isCancelled = subscription?.status === "cancelled" || subscription?.cancelAtPeriodEnd;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end" forceMount>
          {/* Email */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-popover-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Plan actuel */}
          <div className="px-2 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Plan actuel</span>
              {planDisplay.badge === "cancelled" && (
                <Badge variant="secondary" className="text-xs">
                  Annulé
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-popover-foreground">{planDisplay.label}</span>
              {planDisplay.badge === "pro" && (
                <Badge variant="default" className="text-xs">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{getPlanDateText()}</p>
          </div>

          <DropdownMenuSeparator />

          {/* Gérer l'abonnement */}
          <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Gérer l'abonnement</span>
          </DropdownMenuItem>

          {/* Facturation */}
          <DropdownMenuItem onClick={handleBilling} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Facturation</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Préférences d'affichage */}
          <DropdownMenuItem
            onClick={() => router.push("/app/preferences/display")}
            className="cursor-pointer"
          >
            <Palette className="mr-2 h-4 w-4" />
            <span>Préférences d'affichage</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Annuler ou Réactiver */}
          {isCancelled ? (
            <DropdownMenuItem
              onClick={() => router.push("/app/account/subscription?action=reactivate")}
              className="cursor-pointer"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              <span>Réactiver l'abonnement</span>
            </DropdownMenuItem>
          ) : subscription?.plan !== "trial" ? (
            <DropdownMenuItem
              onClick={() => setShowCancelDialog(true)}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <X className="mr-2 h-4 w-4" />
              <span>Annuler l'abonnement</span>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          {/* Déconnexion */}
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch("/auth/logout", {
                  method: "POST",
                  credentials: "include",
                  redirect: "follow",
                });
                
                // La route retourne une redirection 303, mais fetch ne la suit pas automatiquement
                // On force toujours la redirection vers /login après la requête
                if (response.redirected) {
                  window.location.href = response.url;
                } else {
                  // Même si pas de redirection explicite, on redirige vers login
                  window.location.href = "/login";
                }
              } catch (error) {
                console.error("Erreur lors de la déconnexion:", error);
                // En cas d'erreur, forcer la redirection vers login
                window.location.href = "/login";
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modale d'annulation */}
      {subscription && (
        <CancelSubscriptionDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          subscription={subscription}
        />
      )}
    </>
  );
}

