"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTranslations } from "next-intl";

export function MarketingFooter() {
  const t = useTranslations("landing.footer");
  const tLegal = useTranslations("legal.footer");
  
  return (
    <footer className="border-t border-slate-200/60 bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Logo href="/" size="md" />
            <p className="text-sm text-slate-600">
              {t("description")}
            </p>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t("product")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {t("features")}
                </Link>
              </li>
              <li>
                <Link href="#weekly-review" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {t("weeklyReview")}
                </Link>
              </li>
              <li>
                <Link href="#roadmap" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {t("howItWorks")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t("resources")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#use-cases" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {t("useCases")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  {t("pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t("getStarted")}</h3>
            <Link href="/signup">
              <Button size="sm" className="w-full bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
                {t("tryForFree")}
              </Button>
            </Link>
            <Link href="/login" className="block mt-2 text-center text-sm text-slate-600 hover:text-slate-900 transition-colors">
              {t("login")}
            </Link>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 pt-8 border-t border-slate-200/60">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{t("legal")}</span>
            <Link href="/legal/mentions-legales" className="hover:text-slate-900 transition-colors">
              {tLegal("mentionsLegales")}
            </Link>
            <Link href="/legal/confidentialite" className="hover:text-slate-900 transition-colors">
              {tLegal("confidentialite")}
            </Link>
            <Link href="/legal/cgu" className="hover:text-slate-900 transition-colors">
              {tLegal("cgu")}
            </Link>
            <Link href="/legal/cgv" className="hover:text-slate-900 transition-colors">
              {tLegal("cgv")}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>© {new Date().getFullYear()} PILOTYS. {t("copyright")}.</p>
        </div>
      </div>
    </footer>
  );
}

