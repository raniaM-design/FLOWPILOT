"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { MessagesDropdown } from "@/components/messages/messages-dropdown";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/search-context";
import { useTranslations } from "next-intl";
import { MobileSidebar } from "@/components/mobile-sidebar";

interface SubscriptionInfo {
  plan: "trial" | "pro" | "pro_annual" | "cancelled";
  status: "active" | "cancelled" | "expired";
  currentPeriodEnd?: string | Date; // Accepte string (ISO) ou Date
  cancelAtPeriodEnd?: boolean;
}

interface AppTopbarProps {
  userEmail?: string | null;
  userRole?: string | null;
  subscription?: SubscriptionInfo;
  isCompanyAdmin?: boolean;
  hasCompany?: boolean;
}

export function AppTopbar({ userEmail, userRole, subscription, isCompanyAdmin, hasCompany }: AppTopbarProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const t = useTranslations("common");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!userEmail) {
    return null;
  }

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:px-6">
        {/* Logo et menu hamburger mobile */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Bouton hamburger mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
          <Logo href="/app" size="md" />
        </div>

        {/* Barre de recherche au centre - cachée sur mobile très petit */}
        <div className="hidden sm:flex flex-1 max-w-2xl mx-4 md:mx-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] z-10 pointer-events-none" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder") || "Rechercher..."}
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                console.log("[AppTopbar] Recherche modifiée:", value);
                setSearchQuery(value);
              }}
              className="h-9 bg-white border-[#E5E7EB] text-[#111111] placeholder:text-[#667085] focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB]/20 !pl-12 !pr-3 w-full"
              style={{ paddingLeft: '3rem', paddingRight: '0.75rem' }}
            />
          </div>
        </div>

        {/* Icône de recherche mobile - visible uniquement sur très petit écran */}
        <div className="sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              // Focus sur la recherche si elle existe, sinon on pourrait ouvrir un modal de recherche
              const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            }}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Rechercher</span>
          </Button>
        </div>

        {/* Icônes à droite */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* Messages */}
          <MessagesDropdown />

          {/* Menu utilisateur */}
          <UserMenu userEmail={userEmail} userRole={userRole} subscription={subscription} />
        </div>
      </div>

      {/* Barre de recherche mobile - visible uniquement sur très petit écran quand on clique sur l'icône */}
      <div className="sm:hidden border-b border-[#E5E7EB] bg-white px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] z-10 pointer-events-none" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder") || "Rechercher..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 bg-white border-[#E5E7EB] text-[#111111] placeholder:text-[#667085] focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB]/20 !pl-10 !pr-3 w-full"
          />
        </div>
      </div>

      {/* Sidebar mobile */}
      <MobileSidebar
        userRole={userRole}
        isCompanyAdmin={isCompanyAdmin}
        hasCompany={hasCompany}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
    </>
  );
}
