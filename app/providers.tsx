"use client";

import { PreferencesProvider } from "@/components/preferences-provider";
// TEMPORAIREMENT DÉSACTIVÉ pour éliminer le middleware automatique généré par next-intl
// import { NextIntlClientProvider } from "next-intl";

export default function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: any;
}) {
  return (
    // TEMPORAIREMENT DÉSACTIVÉ : NextIntlClientProvider génère un middleware automatique
    // <NextIntlClientProvider locale={locale} messages={messages}>
      <PreferencesProvider>
        <div className="contents">{children}</div>
      </PreferencesProvider>
    // </NextIntlClientProvider>
  );
}
