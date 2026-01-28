import { LegalPage } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.cgu");
  
  return {
    title: `${t("title")} - PILOTYS`,
    description: t("description"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CGUPage() {
  return (
    <LegalPage
      titleKey="cgu"
      descriptionKey="cgu.description"
      sectionsKey="cgu.sections"
    />
  );
}

/* 
TESTS MANUELS:
- [ ] Page accessible à /legal/cgu
- [ ] Titre et description affichés correctement
- [ ] Toutes les sections présentes avec titres et contenus
- [ ] Formatage des listes fonctionne
- [ ] Placeholders {{LEGAL_NAME}} visibles
- [ ] Responsive sur mobile
- [ ] i18n FR/EN fonctionne
*/

