import { LegalPage } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.cgv");
  
  return {
    title: `${t("title")} - PILOTYS`,
    description: t("description"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CGVPage() {
  return (
    <LegalPage
      titleKey="cgv"
      descriptionKey="cgv.description"
      sectionsKey="cgv.sections"
    />
  );
}

/* 
TESTS MANUELS:
- [ ] Page accessible à /legal/cgv
- [ ] Titre et description affichés correctement
- [ ] Toutes les sections présentes avec titres et contenus
- [ ] Formatage des listes fonctionne
- [ ] Placeholders {{CONTACT_EMAIL}} visibles
- [ ] Responsive sur mobile
- [ ] i18n FR/EN fonctionne
*/

