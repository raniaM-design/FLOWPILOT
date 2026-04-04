"use client";

import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { MessagesDropdown } from "@/components/messages/messages-dropdown";
import { Search, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/search-context";
import { useTranslations } from "next-intl";
import { GlobalSearchDropdown } from "@/components/search/global-search-dropdown";
import { usePathname, useRouter } from "next/navigation";
import { resolveMobilePageTitle, shouldShowMobileBack } from "@/lib/app-mobile-nav";

interface SubscriptionInfo {
  plan: "trial" | "pro" | "pro_annual" | "cancelled";
  status: "active" | "cancelled" | "expired";
  currentPeriodEnd?: string | Date;
  cancelAtPeriodEnd?: boolean;
}

interface AppTopbarProps {
  userEmail?: string | null;
  userName?: string | null;
  userAvatarUrl?: string | null;
  userRole?: string | null;
  subscription?: SubscriptionInfo;
  isCompanyAdmin?: boolean;
  hasCompany?: boolean;
}

export function AppTopbar({
  userEmail,
  userName,
  userAvatarUrl,
  userRole,
  subscription,
}: AppTopbarProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const t = useTranslations("common");
  const tMobile = useTranslations("appMobile");
  const pathname = usePathname() ?? "";
  const router = useRouter();

  if (!userEmail) {
    return null;
  }

  const mobileTitle = resolveMobilePageTitle(pathname, (key) => tMobile(key));
  const showBack = shouldShowMobileBack(pathname);

  return (
    <>
      {/* Header mobile : 52px, retour ou logo | titre | avatar */}
      <div className="flex h-[52px] items-center justify-between gap-2 border-b border-[#E5E7EB] bg-white px-3 md:hidden">
        <div className="flex w-[7.25rem] shrink-0 items-center justify-start">
          {showBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.back()}
              aria-label={t("back")}
            >
              <ChevronLeft className="h-6 w-6 text-[#111111]" />
            </Button>
          ) : (
            <Logo
              href="/app"
              size="sm"
              className="w-full max-w-[7rem] [&_img]:!max-h-8"
            />
          )}
        </div>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-medium leading-tight text-[#111111]">
          {mobileTitle}
        </h1>
        <div className="flex w-10 shrink-0 justify-end">
          <UserMenu
            userEmail={userEmail}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            userRole={userRole}
            subscription={subscription}
            compactTrigger
          />
        </div>
      </div>

      {/* Recherche mobile (sous le header) */}
      <div className="border-b border-[#E5E7EB] bg-white px-3 pb-2 pt-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#667085]" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder") || "Rechercher..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full border-[#E5E7EB] bg-white !pl-10 !pr-3 text-[#111111] placeholder:text-[#667085] focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB]/20"
          />
          <GlobalSearchDropdown />
        </div>
      </div>

      {/* Topbar desktop */}
      <div className="hidden h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:flex md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Logo href="/app" size="md" />
        </div>

        <div className="mx-4 flex max-w-2xl flex-1 md:mx-8">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#667085]" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder") || "Rechercher..."}
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
              }}
              className="h-9 w-full border-[#E5E7EB] bg-white !pl-12 !pr-3 text-[#111111] placeholder:text-[#667085] focus-visible:border-[#2563EB] focus-visible:ring-1 focus-visible:ring-[#2563EB]/20"
              style={{ paddingLeft: "3rem", paddingRight: "0.75rem" }}
            />
            <GlobalSearchDropdown />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          <NotificationsDropdown />
          <MessagesDropdown />
          <UserMenu
            userEmail={userEmail}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            userRole={userRole}
            subscription={subscription}
          />
        </div>
      </div>
    </>
  );
}
