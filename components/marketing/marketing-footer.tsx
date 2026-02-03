"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTranslations } from "next-intl";

export function MarketingFooter() {
  const t = useTranslations("landing.footer");
  const tLegal = useTranslations("legal.footer");
  
  // Fallback pour éviter d'afficher les clés de traduction
  const getText = (key: string, fallback?: string) => {
    try {
      const text = t(key);
      // Si la traduction retourne la clé elle-même, utiliser le fallback
      if (text && !text.startsWith("landing.footer.") && !text.startsWith("legal.footer.")) {
        return text;
      }
      return fallback || key;
    } catch {
      return fallback || key;
    }
  };
  
  const getLegalText = (key: string, fallback?: string) => {
    try {
      const text = tLegal(key);
      if (text && !text.startsWith("legal.footer.")) {
        return text;
      }
      return fallback || key;
    } catch {
      return fallback || key;
    }
  };
  
  return (
    <footer className="border-t border-slate-200/60 bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Logo href="/" size="md" />
            <p className="text-sm text-slate-600">
              {getText("description", "Pilotage de décisions et d'actions. Transformez vos décisions en résultats concrets.")}
            </p>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{getText("product", "Produit")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {getText("features", "Fonctionnalités")}
                </Link>
              </li>
              <li>
                <Link href="#weekly-review" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {getText("weeklyReview", "Weekly Review")}
                </Link>
              </li>
              <li>
                <Link href="#roadmap" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {getText("howItWorks", "Comment ça marche")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{getText("resources", "Ressources")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#use-cases" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {getText("useCases", "Cas d'usage")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {getText("pricing", "Tarifs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{getText("getStarted", "Commencer")}</h3>
            <Link href="/signup">
              <Button size="sm" className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
                {getText("tryForFree", "Essayer gratuitement")}
              </Button>
            </Link>
            <Link href="/login" className="block mt-2 text-center text-sm text-slate-600 hover:text-slate-900 transition-colors">
              {getText("login", "Se connecter")}
            </Link>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 pt-8 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{getText("legal", "Légal")}</span>
            <Link href="/legal/mentions-legales" className="hover:text-slate-900 transition-colors">
              {getLegalText("mentionsLegales", "Mentions légales")}
            </Link>
            <Link href="/legal/confidentialite" className="hover:text-slate-900 transition-colors">
              {getLegalText("confidentialite", "Confidentialité")}
            </Link>
            <Link href="/legal/cgu" className="hover:text-slate-900 transition-colors">
              {getLegalText("cgu", "CGU")}
            </Link>
            <Link href="/legal/cgv" className="hover:text-slate-900 transition-colors">
              {getLegalText("cgv", "CGV")}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>© {new Date().getFullYear()} PILOTYS. {getText("copyright", "Tous droits réservés")}.</p>
        </div>
      </div>
    </footer>
  );
}

