import { LegalPage } from "@/components/legal/legal-page";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.mentionsLegales");
  
  return {
    title: `${t("title")} - PILOTYS`,
    description: t("description"),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      titleKey="mentionsLegales"
      descriptionKey="mentionsLegales.description"
      sectionsKey="mentionsLegales.sections"
    />
  );
}

/* 
TESTS MANUELS:
- [ ] Page accessible à /legal/mentions-legales
- [ ] Titre et description affichés correctement
- [ ] Toutes les sections présentes avec titres et contenus
- [ ] Formatage des listes fonctionne
- [ ] Placeholders {{LEGAL_NAME}} etc. visibles (à remplacer plus tard)
- [ ] Responsive sur mobile
- [ ] i18n FR/EN fonctionne
*/

