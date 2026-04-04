"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, FileText, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function MarketingHeader() {
  const pathname = usePathname();
  const t = useTranslations("landing.navigation");
  const tLegal = useTranslations("legal.footer");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const elementId = anchor.replace("#", "");
      const element = document.getElementById(elementId);
      if (element) {
        window.history.pushState(null, "", anchor);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setMenuOpen(false);
  };

  const navLinks = (
    <>
      <Link
        href="/#how-it-works"
        onClick={(e) => handleAnchorClick(e, "#how-it-works")}
        className="text-base font-medium text-slate-700 hover:text-slate-900 md:text-sm"
      >
        {t("product")}
      </Link>
      <Link
        href="/#use-cases"
        onClick={(e) => handleAnchorClick(e, "#use-cases")}
        className="text-base font-medium text-slate-700 hover:text-slate-900 md:text-sm"
      >
        {t("forWho")}
      </Link>
      <Link href="/pricing" className="text-base font-medium text-slate-700 hover:text-slate-900 md:text-sm">
        {t("pricing")}
      </Link>
      <Link href="/faq" className="text-base font-medium text-slate-700 hover:text-slate-900 md:text-sm">
        FAQ
      </Link>
      <Link
        href="mailto:contact@pilotys.com"
        className="text-base font-medium text-slate-700 hover:text-slate-900 md:text-sm"
      >
        {t("contact")}
      </Link>
    </>
  );

  const legalLinks = (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:border-0 md:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("legal")}</p>
      <Link href="/legal/mentions-legales" className="flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 shrink-0" />
        {tLegal("mentionsLegales")}
      </Link>
      <Link href="/legal/confidentialite" className="flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 shrink-0" />
        {tLegal("confidentialite")}
      </Link>
      <Link href="/legal/cgu" className="flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 shrink-0" />
        {tLegal("cgu")}
      </Link>
      <Link href="/legal/cgv" className="flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4 shrink-0" />
        {tLegal("cgv")}
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full max-md:h-14 max-md:max-h-14 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm md:max-h-none">
      <div className="container mx-auto max-md:px-5 md:px-6">
        <div className="flex max-md:h-14 max-md:items-center max-md:justify-between md:h-16 md:items-end md:justify-between md:pb-1">
          <div className="flex min-w-0 shrink-0 items-center overflow-visible max-md:h-full md:items-end md:pb-0.5">
            <Logo href="/" size="lg" className="min-w-0 [&_img]:max-h-8 md:[&_img]:max-h-10" />
          </div>

          <nav className="hidden items-center gap-6 md:flex">{navLinks}</nav>

          <div className="hidden items-center gap-3 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t("legal")}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/legal/mentions-legales" className="flex cursor-pointer items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {tLegal("mentionsLegales")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/confidentialite" className="flex cursor-pointer items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {tLegal("confidentialite")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/cgu" className="flex cursor-pointer items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {tLegal("cgu")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/cgv" className="flex cursor-pointer items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {tLegal("cgv")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t("login")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90">
                {t("tryPilotys")}
              </Button>
            </Link>
          </div>

          {/* Mobile : logo (gauche) + CTA + menu */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/signup" className="shrink-0">
              <Button size="sm" className="h-9 bg-[hsl(var(--brand))] px-3 text-xs text-white hover:bg-[hsl(var(--brand))]/90">
                {t("tryPilotys")}
              </Button>
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="h-[100dvh] w-[100vw] max-w-none rounded-none border-0 p-0 data-[state=open]:duration-300 [&>button]:right-4 [&>button]:top-4"
              >
                <SheetHeader className="border-b border-slate-100 px-5 pb-4 pt-14 text-left">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 overflow-y-auto px-5 pb-10 pt-6">
                  <nav className="flex flex-col gap-4">{navLinks}</nav>
                  {legalLinks}
                  <div className="border-t border-slate-200 pt-4">
                    <LanguageSwitcher />
                  </div>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t("login")}
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
