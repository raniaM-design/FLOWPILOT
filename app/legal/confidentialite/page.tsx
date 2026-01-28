import { LegalPage } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import { getTranslations } from "@/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.confidentialite");
  
  return {
    title: `${t("title")} - PILOTYS`,
    description: t("description"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ConfidentialitePage() {
  return (
    <LegalPage
      titleKey="confidentialite"
      descriptionKey="confidentialite.description"
      sectionsKey="confidentialite.sections"
    />
  );
}

/* 
TESTS MANUELS:
- [ ] Page accessible à /legal/confidentialite
- [ ] Titre et description affichés correctement
- [ ] Toutes les sections présentes avec titres et contenus
- [ ] Formatage des listes fonctionne
- [ ] Placeholders {{CONTACT_EMAIL}} visibles
- [ ] Responsive sur mobile
- [ ] i18n FR/EN fonctionne
*/

