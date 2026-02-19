import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { getLocaleFromRequest, getMessagesFromRequest } from "@/i18n/request";
import { Analytics } from "@vercel/analytics/next";

// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";
// Forcer le rendu dynamique car le layout utilise cookies() via getLocaleFromRequest()
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PILOTYS",
  description: "Pilotage de décisions et d'actions. Transformez vos décisions en résultats concrets.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Valeurs par défaut garanties
  let locale: string = "fr";
  let messages: Record<string, any> = {};

  // Protection maximale pour éviter tout crash SSR
  try {
    locale = await getLocaleFromRequest();
    console.log("[layout] Locale détectée:", locale);
  } catch (err) {
    console.error("[layout] Error in getLocaleFromRequest:", err);
    locale = "fr"; // Fallback garanti
  }

  try {
    messages = await getMessagesFromRequest();
    console.log("[layout] Messages chargés pour locale:", locale, "-", Object.keys(messages).length, "clés");
  } catch (err) {
    console.error("[layout] Error in getMessagesFromRequest:", err);
    messages = {}; // Fallback garanti
  }

  // Rendu avec valeurs garanties
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
