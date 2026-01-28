"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function AppFooter() {
  const t = useTranslations("legal.footer");

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{t("legal")}</span>
          <Link href="/legal/mentions-legales" className="hover:text-foreground transition-colors">
            {t("mentionsLegales")}
          </Link>
          <Link href="/legal/confidentialite" className="hover:text-foreground transition-colors">
            {t("confidentialite")}
          </Link>
          <Link href="/legal/cgu" className="hover:text-foreground transition-colors">
            {t("cgu")}
          </Link>
          <Link href="/legal/cgv" className="hover:text-foreground transition-colors">
            {t("cgv")}
          </Link>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PILOTYS. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

