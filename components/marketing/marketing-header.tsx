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
import { ChevronDown, FileText } from "lucide-react";

export function MarketingHeader() {
  const pathname = usePathname();
  
  // Fonction pour gérer les liens avec ancres - redirige vers la page d'accueil si nécessaire
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (pathname === "/") {
      // Si on est déjà sur la page d'accueil, empêcher le comportement par défaut et scroll
      e.preventDefault();
      const elementId = anchor.replace("#", "");
      const element = document.getElementById(elementId);
      if (element) {
        // Mettre à jour l'URL sans recharger la page
        window.history.pushState(null, "", anchor);
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    // Sinon, laisser le lien Next.js gérer la navigation vers "/#features" etc.
    // Le composant AnchorScrollHandler gérera le scroll après la navigation
  };

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
            <Link 
              href="/#features" 
              onClick={(e) => handleAnchorClick(e, "#features")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Produit
            </Link>
            <Link 
              href="/#weekly-review" 
              onClick={(e) => handleAnchorClick(e, "#weekly-review")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Weekly Review
            </Link>
            <Link 
              href="/#roadmap" 
              onClick={(e) => handleAnchorClick(e, "#roadmap")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Comment ça marche
            </Link>
            <Link 
              href="/#use-cases" 
              onClick={(e) => handleAnchorClick(e, "#use-cases")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pour qui ?
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Tarifs
            </Link>
            <Link href="mailto:contact@pilotys.com" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
                  Légal
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/legal/mentions-legales" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Mentions légales
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/confidentialite" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Confidentialité
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/cgu" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    CGU
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/cgv" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    CGV
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

