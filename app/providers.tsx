"use client";

import { PreferencesProvider } from "@/components/preferences-provider";
import { NextIntlClientProvider } from "next-intl";

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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PreferencesProvider>
        <div className="contents">{children}</div>
      </PreferencesProvider>
    </NextIntlClientProvider>
  );
}
