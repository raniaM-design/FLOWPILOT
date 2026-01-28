import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  
  return {
    title: `${t("title")} - PILOTYS`,
    description: t("mentionsLegales.description"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-16">
        {children}
      </div>
    </div>
  );
}

