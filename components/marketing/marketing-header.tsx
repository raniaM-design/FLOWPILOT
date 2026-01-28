"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-end justify-between">
          {/* Logo - Plus grand pour renforcer l'identité de marque */}
          <div className="h-full flex items-end pb-1">
            <div style={{ transform: 'scale(1.75)' }}>
              <Logo href="/" size="xl" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Produit
            </Link>
            <Link href="#weekly-review" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Weekly Review
            </Link>
            <Link href="#roadmap" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Comment ça marche
            </Link>
            <Link href="#use-cases" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pour qui ?
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Tarifs
            </Link>
          </nav>

          {/* Language Switcher + CTAs */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Se connecter
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
                Essayer PILOTYS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

