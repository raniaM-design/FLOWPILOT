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
  Shield,
  Users,
  User,
  Check,
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
  userRole?: string | null;
  subscription?: SubscriptionInfo;
}

export function UserMenu({ userEmail, userRole, subscription }: UserMenuProps) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

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
  const isAdmin = userRole === "ADMIN";
  const isSupport = userRole === "SUPPORT";
  const isUser = userRole === "USER";
  
  // Afficher le menu de changement de rôle pour tous les utilisateurs
  // Le serveur vérifiera les permissions réelles lors du changement
  // Cela permet aux admins qui sont temporairement en USER de rechanger
  const canSwitchRole = userRole !== null && userRole !== undefined;

  const handleSwitchRole = async (newRole: string) => {
    // La vérification des permissions se fait côté serveur
    // On permet toujours l'appel, le serveur refusera si nécessaire

    setIsSwitchingRole(true);
    try {
      const formData = new FormData();
      formData.append("role", newRole);

      const response = await fetch("/api/user/switch-role", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors du changement de rôle");
      }

      const data = await response.json();
      
      // Forcer un rechargement complet de la page pour appliquer le nouveau rôle
      // Utiliser window.location.href pour forcer un refresh complet
      window.location.href = window.location.origin + window.location.pathname;
    } catch (error: any) {
      console.error("Erreur lors du changement de rôle:", error);
      alert(`Erreur: ${error.message}`);
      setIsSwitchingRole(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "SUPPORT":
        return "Support";
      case "USER":
        return "Utilisateur";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return Shield;
      case "SUPPORT":
        return Users;
      case "USER":
        return User;
      default:
        return User;
    }
  };

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
        <DropdownMenuContent className="w-80 p-0 border-0 shadow-xl bg-white rounded-xl" align="end" forceMount>
          {/* Email - Header coloré */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-t-xl">
            <p className="text-sm font-semibold text-slate-900">{userEmail}</p>
          </div>

          {/* Plan actuel - Section colorée */}
          <div className="px-4 py-4 bg-purple-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Plan actuel</span>
              {planDisplay.badge === "cancelled" && (
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-0">
                  Annulé
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-bold text-purple-700">{planDisplay.label}</span>
              {planDisplay.badge === "pro" && (
                <Badge className="text-xs bg-purple-100 text-purple-700 border-0 font-semibold">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600">{getPlanDateText()}</p>
          </div>

          {/* Gérer l'abonnement */}
          <div className="px-2 py-1">
            <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer rounded-lg hover:bg-blue-50">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium">Gérer l'abonnement</span>
            </DropdownMenuItem>

            {/* Facturation */}
            <DropdownMenuItem onClick={handleBilling} className="cursor-pointer rounded-lg hover:bg-indigo-50">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="font-medium">Facturation</span>
            </DropdownMenuItem>
          </div>

          {/* Basculement de rôle */}
          {canSwitchRole && (
            <>
              <div className="px-4 py-3 bg-amber-50/50 border-y border-amber-100/50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block">Profil actuel</span>
                <Badge className="text-xs bg-amber-100 text-amber-700 border-0 font-semibold">
                  {getRoleLabel(userRole || "USER")}
                </Badge>
              </div>
              <div className="px-2 py-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 block px-2">
                  Basculer vers :
                </span>
                {["USER", "SUPPORT", "ADMIN"].map((role) => {
                  if (role === userRole) return null;
                  const roleColors = {
                    USER: { bg: "bg-blue-100", icon: "text-blue-600", hover: "hover:bg-blue-50" },
                    SUPPORT: { bg: "bg-emerald-100", icon: "text-emerald-600", hover: "hover:bg-emerald-50" },
                    ADMIN: { bg: "bg-purple-100", icon: "text-purple-600", hover: "hover:bg-purple-50" },
                  };
                  const colors = roleColors[role as keyof typeof roleColors] || roleColors.USER;
                  const IconComponent = getRoleIcon(role);
                  return (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      disabled={isSwitchingRole}
                      className={`cursor-pointer rounded-lg ${colors.hover}`}
                    >
                      <div className={`h-8 w-8 rounded-lg ${colors.bg} flex items-center justify-center mr-3`}>
                        <IconComponent className={`h-4 w-4 ${colors.icon}`} />
                      </div>
                      <span className="font-medium">{getRoleLabel(role)}</span>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </>
          )}

          {/* Préférences d'affichage */}
          <div className="px-2 py-1 border-t border-slate-100">
            <DropdownMenuItem
              onClick={() => router.push("/app/preferences/display")}
              className="cursor-pointer rounded-lg hover:bg-slate-50"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
                <Palette className="h-4 w-4 text-slate-600" />
              </div>
              <span className="font-medium">Préférences d'affichage</span>
            </DropdownMenuItem>
          </div>

          {/* Annuler ou Réactiver */}
          {isCancelled ? (
            <div className="px-2 py-1 border-t border-slate-100">
              <DropdownMenuItem
                onClick={() => router.push("/app/account/subscription?action=reactivate")}
                className="cursor-pointer rounded-lg hover:bg-emerald-50"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="font-medium text-emerald-700">Réactiver l'abonnement</span>
              </DropdownMenuItem>
            </div>
          ) : subscription?.plan !== "trial" ? (
            <div className="px-2 py-1 border-t border-slate-100">
              <DropdownMenuItem
                onClick={() => setShowCancelDialog(true)}
                className="cursor-pointer rounded-lg hover:bg-red-50 text-red-600 focus:text-red-600"
              >
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center mr-3">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium">Annuler l'abonnement</span>
              </DropdownMenuItem>
            </div>
          ) : null}

          {/* Déconnexion */}
          <div className="px-2 py-2 border-t-2 border-slate-200 bg-slate-50 rounded-b-xl">
            <DropdownMenuItem 
              className="cursor-pointer rounded-lg hover:bg-red-50 text-red-600 focus:text-red-600"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch("/auth/logout", {
                    method: "POST",
                    credentials: "include",
                    redirect: "follow",
                  });
                  
                  if (response.redirected) {
                    window.location.href = response.url;
                  } else {
                    window.location.href = "/login";
                  }
                } catch (error) {
                  console.error("Erreur lors de la déconnexion:", error);
                  window.location.href = "/login";
                }
              }}
            >
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center mr-3">
                <LogOut className="h-4 w-4 text-red-600" />
              </div>
              <span className="font-semibold">Déconnexion</span>
            </DropdownMenuItem>
          </div>
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

