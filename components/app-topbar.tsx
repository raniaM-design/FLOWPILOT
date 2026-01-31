"use client";

import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { MessagesDropdown } from "@/components/messages/messages-dropdown";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
}

export function AppTopbar({ userEmail, userRole, subscription }: AppTopbarProps) {
  if (!userEmail) {
    return null;
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-6">
      {/* Logo à gauche */}
      <div className="flex items-end gap-4">
        <Logo href="/app" size="md" />
      </div>

      {/* Barre de recherche au centre */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] z-10 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search"
            className="h-9 bg-white border-[#E5E7EB] text-[#111111] placeholder:text-[#667085] focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB]/20 !pl-12 !pr-3"
            style={{ paddingLeft: '3rem', paddingRight: '0.75rem' }}
          />
        </div>
      </div>

      {/* Icônes à droite */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* Messages */}
        <MessagesDropdown />

        {/* Menu utilisateur */}
        <UserMenu userEmail={userEmail} userRole={userRole} subscription={subscription} />
      </div>
    </div>
  );
}
