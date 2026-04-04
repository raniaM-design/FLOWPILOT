"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTranslations } from "next-intl";

export function MarketingFooter() {
  const t = useTranslations("landing.footer");
  const tLegal = useTranslations("legal.footer");

  const getText = (key: string, fallback?: string) => {
    try {
      const text = t(key);
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
      {/* Mobile : logo + 3 liens légaux + copyright */}
      <div className="mx-auto px-5 py-10 md:hidden">
        <div className="flex flex-col items-center gap-8 text-center">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight text-[#1a1a2e]"
            style={{ fontSize: "14px" }}
          >
            PILOTYS
          </Link>
          <nav className="flex flex-col gap-3 text-sm text-slate-600">
            <Link href="/legal/mentions-legales" className="hover:text-slate-900">
              {getLegalText("mentionsLegales", "Mentions légales")}
            </Link>
            <Link href="/legal/confidentialite" className="hover:text-slate-900">
              {getLegalText("confidentialite", "Confidentialité")}
            </Link>
            <Link href="/legal/cgu" className="hover:text-slate-900">
              {getLegalText("cgu", "CGU")}
            </Link>
          </nav>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} PILOTYS. {getText("copyright", "Tous droits réservés")}.
          </p>
        </div>
      </div>

      {/* Desktop : grille complète */}
      <div className="container mx-auto hidden px-6 py-12 md:block">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Logo href="/" size="md" />
            <p className="text-sm text-slate-600">
              {getText(
                "description",
                "Pilotage de décisions et d'actions. Transformez vos décisions en résultats concrets.",
              )}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">{getText("product", "Produit")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#how-it-works" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                  {getText("features", "Fonctionnalités")}
                </Link>
              </li>
              <li>
                <Link
                  href="#weekly-review"
                  className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                >
                  {getText("weeklyReview", "Weekly Review")}
                </Link>
              </li>
              <li>
                <Link href="#roadmap" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                  {getText("howItWorks", "Comment ça marche")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">{getText("support", "Support")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                  {getText("faq", "FAQ")}
                </Link>
              </li>
              <li>
                <Link href="#use-cases" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                  {getText("useCases", "Cas d'usage")}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@pilotys.com"
                  className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                >
                  {getText("contact", "Contact")}
                </a>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                  {getText("pricing", "Tarifs")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">{getText("getStarted", "Commencer")}</h3>
            <Link href="/signup">
              <Button size="sm" className="w-full bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90">
                {getText("tryForFree", "Essayer gratuitement")}
              </Button>
            </Link>
            <Link
              href="/login"
              className="mt-2 block text-center text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              {getText("login", "Se connecter")}
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/60 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{getText("legal", "Légal")}</span>
            <Link href="/legal/mentions-legales" className="transition-colors hover:text-slate-900">
              {getLegalText("mentionsLegales", "Mentions légales")}
            </Link>
            <Link href="/legal/confidentialite" className="transition-colors hover:text-slate-900">
              {getLegalText("confidentialite", "Confidentialité")}
            </Link>
            <Link href="/legal/cgu" className="transition-colors hover:text-slate-900">
              {getLegalText("cgu", "CGU")}
            </Link>
            <Link href="/legal/cgv" className="transition-colors hover:text-slate-900">
              {getLegalText("cgv", "CGV")}
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            © {new Date().getFullYear()} PILOTYS. {getText("copyright", "Tous droits réservés")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
