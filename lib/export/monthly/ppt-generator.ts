/**
 * Générateur PPT pour Monthly Review
 * Design premium - Identité visuelle PILOTYS professionnelle
 */

import "server-only";
import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { LOGO_OFFICIAL_PATH, LOGO_OFFICIAL_DIMENSIONS } from "@/lib/logo-config";
import type { MonthlyReviewExportData } from "@/lib/review/monthly/types";

type Slide = ReturnType<PptxGenJS["addSlide"]>;
type ChartBuffers = {
  activity: Buffer | null;
  status: Buffer | null;
  projects: Buffer | null;
};

// Constantes de mise en page (format PowerPoint standard 16:9)
// Dimensions exactes : 10" x 7.5"
const SLIDE_W = 10.0; // Largeur exacte PowerPoint 16:9
const SLIDE_H = 7.5; // Hauteur exacte PowerPoint 16:9
const MARGIN_X = 0.5; // Marges pour éviter débordement
const MARGIN_TOP = 0.5;
const MARGIN_BOTTOM = 0.5; // Marge inférieure pour éviter débordement
const CONTENT_W = SLIDE_W - (MARGIN_X * 2); // 9.0 (garantit que le contenu ne dépasse pas)
const CONTENT_H = SLIDE_H - MARGIN_TOP - MARGIN_BOTTOM; // 6.5 (hauteur disponible)

// Position logo (fixe - identité de marque, dimensions exactes selon format graphique)
// Dimensions : 2.97 cm × 7.21 cm = 1.17" × 2.84" (1 pouce = 2.54 cm)
const LOGO_X = MARGIN_X;
const LOGO_Y = 0.1; // Positionné en haut de la page
const LOGO_H = 2.97 / 2.54; // ~1.17 pouces (hauteur exacte)
const LOGO_W = 7.21 / 2.54; // ~2.84 pouces (largeur exacte)

// Couleurs PILOTYS (palette stricte)
const COLORS = {
  text: "111111",
  muted: "667085",
  divider: "E5E7EB",
  accent: "2563EB", // Bleu PILOTYS
  success: "16A34A",
  danger: "DC2626",
};

// Typographie (proportionnelle au format PowerPoint standard)
const TYPO = {
  h1: 44, // Titre principal cover (standard PowerPoint)
  h2: 18, // Titre slide (18pt comme demandé)
  h3: 12, // Sous-titre section (12pt en gras)
  body: 12, // Texte standard (12pt comme demandé)
  secondary: 12, // Texte secondaire
  meta: 10, // Méta (dates, projets)
};

// Espacements (réduits pour PPT plus compact)
const SPACING = {
  titleToContent: 0.3, // Espace après titre (réduit)
  betweenSections: 0.25, // Entre sections (réduit)
  betweenCards: 0.15, // Entre cartes (réduit)
  betweenLines: 0.1, // Entre lignes (réduit)
  betweenBullets: 0.15, // Entre bullets (réduit)
};

/**
 * Ajoute le logo PILOTYS (identité de marque)
 * Logo intégré en dur - TOUJOURS présent sur chaque slide, partie intégrante du fichier
 * Le logo est intégré directement dans le PPTX et ne peut pas être omis
 */
async function addLogo(slide: Slide, pptx: PptxGenJS): Promise<void> {
  // Logo intégré en dur - toujours présent, ne peut pas être omis
  try {
    // Utiliser le logo PNG officiel depuis branding (depuis src/assets au lieu de public)
    const logoUrl = new URL("../../../src/assets/branding/logo-full.png", import.meta.url);
    const logoPath = fileURLToPath(logoUrl);
    const logoBuffer = await readFile(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    const logoDataUri = `data:image/png;base64,${logoBase64}`;
    
    // Logo intégré directement dans la slide (toujours présent, partie intégrante du fichier PPTX)
    slide.addImage({
      data: logoDataUri,
      x: LOGO_X,
      y: LOGO_Y,
      w: LOGO_W,
      h: LOGO_H,
    });
  } catch (error) {
    console.error("Erreur lors du chargement du logo officiel:", error);
    // Ne pas utiliser de fallback - le logo doit être présent
    // Si le logo n'est pas disponible, c'est une erreur critique
    throw new Error("Le logo officiel PILOTYS n'a pas pu être chargé. Vérifiez que le fichier src/assets/branding/logo-full.png existe.");
  }
}

/**
 * Ajoute une carte premium avec style PILOTYS
 */
function addCard(pptx: PptxGenJS, slide: Slide, x: number, y: number, w: number, h: number, options?: { accent?: boolean }): void {
  const ShapeType = pptx.ShapeType;
  
  // Bordure accent pour highlight
  const borderColor = options?.accent ? COLORS.accent : COLORS.divider;
  const borderWidth = options?.accent ? 2 : 1;
  
  slide.addShape(ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: "FFFFFF" },
    line: { color: borderColor, width: borderWidth },
    rectRadius: 12 / 72, // Rayon légèrement augmenté
  });
}

/**
 * Ajoute une ligne de séparation subtile
 */
function addDivider(pptx: PptxGenJS, slide: Slide, x: number, y: number, w: number): void {
  const ShapeType = pptx.ShapeType;
  slide.addShape(ShapeType.rect, {
    x,
    y,
    w,
    h: 0.01,
    fill: { color: COLORS.divider },
    line: { color: "transparent" },
  });
}

/**
 * Tronque un texte proprement
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + "...";
}

/**
 * Slide 1 : Cover (Identité produit premium)
 */
async function addCoverSlide(
  pptx: PptxGenJS,
  periodLabel: string,
  helpers: { addLogo: (slide: Slide, pptx: PptxGenJS) => Promise<void> },
  userName?: string
): Promise<void> {
  const slide = pptx.addSlide();

  // Logo PILOTYS en haut à gauche
  await helpers.addLogo(slide, pptx);

  // Titre principal centré verticalement et horizontalement (en tenant compte du logo)
  const TITLE_Y = Math.max((SLIDE_H - 0.8 - 0.35) / 2, LOGO_Y + LOGO_H + 0.3); // Centré verticalement mais sous le logo
  
  slide.addText(`Monthly Review — ${periodLabel}`, {
    x: MARGIN_X,
    y: TITLE_Y,
    w: CONTENT_W,
    h: 0.8,
    fontSize: TYPO.h1,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "center",
    valign: "middle",
  });

  // Sous-titre centré
  const SUBTITLE_Y = TITLE_Y + 0.8 + 0.2;
  slide.addText("Pilotage, décisions et avancement des projets", {
    x: MARGIN_X,
    y: SUBTITLE_Y,
    w: CONTENT_W,
    h: 0.35,
    fontSize: TYPO.body,
    color: COLORS.muted,
    fontFace: "Arial",
    align: "center",
  });

  // Nom d'utilisateur et date en bas à droite
  const FOOTER_Y = SLIDE_H - MARGIN_BOTTOM - 0.4;
  const FOOTER_X = SLIDE_W - MARGIN_X - 3.5; // Aligné à droite
  
  if (userName) {
    slide.addText(userName, {
      x: FOOTER_X,
      y: FOOTER_Y,
      w: 3.5,
      h: 0.15,
      fontSize: TYPO.meta,
      color: COLORS.text,
      fontFace: "Arial",
      align: "right",
    });
  }
  
  const downloadDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  slide.addText(downloadDate, {
    x: FOOTER_X,
    y: FOOTER_Y + 0.15 + 0.05,
    w: 3.5,
    h: 0.15,
    fontSize: TYPO.meta,
    color: COLORS.text,
    fontFace: "Arial",
    align: "right",
  });
}

/**
 * Slide 2 : Résumé exécutif & Indicateurs clés (design premium)
 */
async function addExecutiveKpiSlide(
  pptx: PptxGenJS,
  summary: string,
  kpis: MonthlyReviewExportData["kpis"],
  helpers: { addLogo: (slide: Slide, pptx: PptxGenJS) => Promise<void>; addCard: (slide: Slide, x: number, y: number, w: number, h: number, options?: { accent?: boolean }) => void; truncate: (text: string, maxChars: number) => string }
): Promise<void> {
  const slide = pptx.addSlide();

  // Logo PILOTYS
  await helpers.addLogo(slide, pptx);

  // Titre slide (18pt, bien cadré, positionné sous le logo pour éviter chevauchement)
  const TITLE_Y = LOGO_Y + LOGO_H + 0.15; // Positionné sous le logo avec espacement
  slide.addText("Résumé exécutif & Indicateurs clés", {
    x: MARGIN_X,
    y: TITLE_Y,
    w: CONTENT_W,
    h: 0.35,
    fontSize: TYPO.h2,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  const TITLE_BOTTOM = TITLE_Y + 0.35;
  const KPI_SECTION_START = TITLE_BOTTOM + SPACING.titleToContent;

  // SECTION HAUTE : Indicateurs clés (au-dessus du résumé exécutif)
  const KPI_SECTION_H = 1.8; // Hauteur fixe pour les KPIs (plus longs)
  const KPI_CARD_H = (KPI_SECTION_H - SPACING.betweenCards * 2) / 2; // 2 lignes égales (plus longs)
  const KPI_CARD_W = (CONTENT_W - SPACING.betweenCards * 2) / 3; // 3 colonnes égales (moins larges)

  const kpiCards = [
    { label: "Réunions", value: kpis.meetings, row: 0, col: 0, color: COLORS.text },
    { label: "Actions totales", value: kpis.actionsTotal, row: 0, col: 1, color: COLORS.text },
    { label: "Actions terminées", value: kpis.actionsDone, row: 0, col: 2, color: COLORS.success },
    { label: "Actions en retard", value: kpis.actionsOverdue, row: 1, col: 0, color: COLORS.danger },
    { label: "Décisions", value: kpis.decisions, row: 1, col: 1, color: COLORS.text },
    {
      label: "Taux de complétion",
      value: `${kpis.completionRate}%`,
      row: 1,
      col: 2,
      accent: true,
      color: COLORS.accent,
    },
  ];

  kpiCards.forEach((kpi) => {
    const x = MARGIN_X + kpi.col * (KPI_CARD_W + SPACING.betweenCards);
    const y = KPI_SECTION_START + kpi.row * (KPI_CARD_H + SPACING.betweenCards);

    // Carte KPI (plus longue et moins large)
    helpers.addCard(slide, x, y, KPI_CARD_W, KPI_CARD_H, { accent: kpi.accent });

    // Label
    slide.addText(kpi.label, {
      x: x + 0.1,
      y: y + 0.12,
      w: KPI_CARD_W - 0.2,
      h: 0.2,
      fontSize: 10,
      color: COLORS.muted,
      fontFace: "Arial",
    });

    // Valeur avec couleur spécifique selon le type de KPI
    slide.addText(String(kpi.value), {
      x: x + 0.1,
      y: y + 0.35,
      w: KPI_CARD_W - 0.2,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: kpi.color || COLORS.text,
      fontFace: "Arial",
    });
  });

  // SECTION BASSE : Résumé exécutif (pleine largeur, espacé)
  const EXEC_SECTION_START = KPI_SECTION_START + KPI_SECTION_H + SPACING.betweenSections;
  const MAX_EXEC_SECTION_H = SLIDE_H - EXEC_SECTION_START - MARGIN_BOTTOM;
  const EXEC_SECTION_H = Math.min(MAX_EXEC_SECTION_H, CONTENT_H - (EXEC_SECTION_START - MARGIN_TOP));

  helpers.addCard(slide, MARGIN_X, EXEC_SECTION_START, CONTENT_W, EXEC_SECTION_H);

  // Titre section résumé exécutif (sous-titre 12pt en gras, bien cadré)
  slide.addText("Résumé exécutif", {
    x: MARGIN_X + 0.15,
    y: EXEC_SECTION_START + 0.15,
    w: CONTENT_W - 0.3,
    h: 0.25,
    fontSize: TYPO.h3,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  // Bullets du résumé (4 max, espacés)
  const summaryBullets = summary
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 20)
    .slice(0, 4)
    .map((s) => s.trim());

  const BULLET_START_Y = EXEC_SECTION_START + 0.15 + 0.25 + 0.2; // Plus d'espace après le titre
  const BULLET_SPACING = 0.25; // Espacement augmenté entre bullets

  summaryBullets.forEach((bullet, i) => {
    slide.addText(`• ${helpers.truncate(bullet, 100)}`, {
      x: MARGIN_X + 0.2,
      y: BULLET_START_Y + i * BULLET_SPACING,
      w: CONTENT_W - 0.4,
      h: 0.5,
      fontSize: TYPO.body,
      color: COLORS.text,
      fontFace: "Arial",
      lineSpacing: 1.3,
    });
  });
}

/**
 * Slide 3 : Analyse visuelle - Premier graphique (Activité par semaine)
 */
async function addActivityChartSlide(
  pptx: PptxGenJS,
  charts: ChartBuffers,
  helpers: { addLogo: (slide: Slide, pptx: PptxGenJS) => Promise<void> }
): Promise<void> {
  if (!charts.activity || charts.activity.length === 0) {
    return;
  }

  const slide = pptx.addSlide();

  // Logo PILOTYS
  await helpers.addLogo(slide, pptx);

  // Titre slide (18pt, bien cadré, positionné sous le logo)
  const TITLE_Y = LOGO_Y + LOGO_H + 0.15; // Positionné sous le logo avec espacement
  slide.addText("Analyse visuelle", {
    x: MARGIN_X,
    y: TITLE_Y,
    w: CONTENT_W,
    h: 0.35,
    fontSize: TYPO.h2,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  const START_Y = TITLE_Y + 0.35 + SPACING.titleToContent;

  // Titre du graphe (sous-titre 12pt en gras, bien cadré, réduit)
  slide.addText("Activité par semaine", {
    x: MARGIN_X,
    y: START_Y,
    w: CONTENT_W,
    h: 0.22,
    fontSize: TYPO.h3,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  // Graphique (pleine largeur, taille réduite)
  const CHART_Y = START_Y + 0.22 + 0.12;
  const CHART_H = Math.min(4.2, SLIDE_H - CHART_Y - MARGIN_BOTTOM); // Réduit à 4.2"
  
  const activityBase64 = charts.activity.toString("base64");
  slide.addImage({
    data: `data:image/png;base64,${activityBase64}`,
    x: MARGIN_X,
    y: CHART_Y,
    w: CONTENT_W,
    h: CHART_H,
  });
}

/**
 * Slide 4 : Analyse visuelle - Deux autres graphiques (divisés en 2 parties égales)
 */
async function addStatusProjectsChartSlide(
  pptx: PptxGenJS,
  charts: ChartBuffers,
  helpers: { addLogo: (slide: Slide, pptx: PptxGenJS) => Promise<void> }
): Promise<void> {
  if ((!charts.status || charts.status.length === 0) && (!charts.projects || charts.projects.length === 0)) {
    return;
  }

  const slide = pptx.addSlide();

  // Logo PILOTYS
  await helpers.addLogo(slide, pptx);

  // Titre slide (18pt, bien cadré, positionné sous le logo)
  const TITLE_Y = LOGO_Y + LOGO_H + 0.15; // Positionné sous le logo avec espacement
  slide.addText("Analyse visuelle", {
    x: MARGIN_X,
    y: TITLE_Y,
    w: CONTENT_W,
    h: 0.35,
    fontSize: TYPO.h2,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  const START_Y = TITLE_Y + 0.35 + SPACING.titleToContent;
  const COL_W = (CONTENT_W - SPACING.betweenCards) / 2;
  const TITLE_H = 0.22;
  const TITLE_SPACING = 0.12;
  const AVAILABLE_CHART_H = SLIDE_H - START_Y - MARGIN_BOTTOM - TITLE_H - TITLE_SPACING;
  const CHART_H = Math.min(AVAILABLE_CHART_H / 2, 2.5); // Divisé en 2 parties égales, max 2.5" pour garantir dans les limites

  // Graphique gauche : Répartition des actions (camembert)
  if (charts.status && charts.status.length > 0) {
    // Titre du graphe (sous-titre 12pt en gras, bien cadré, réduit)
    slide.addText("Répartition des actions", {
      x: MARGIN_X,
      y: START_Y,
      w: COL_W,
      h: 0.22,
      fontSize: TYPO.h3,
      bold: true,
      color: COLORS.text,
      fontFace: "Arial",
      align: "left",
    });

    const statusBase64 = charts.status.toString("base64");
    slide.addImage({
      data: `data:image/png;base64,${statusBase64}`,
      x: MARGIN_X,
      y: START_Y + 0.22 + 0.12,
      w: COL_W,
      h: CHART_H,
    });
  }

  // Graphique droite : Avancement des projets (barres horizontales)
  if (charts.projects && charts.projects.length > 0) {
    // Titre du graphe (sous-titre 12pt en gras, bien cadré, réduit)
    slide.addText("Avancement des projets", {
      x: MARGIN_X + COL_W + SPACING.betweenCards,
      y: START_Y,
      w: COL_W,
      h: 0.22,
      fontSize: TYPO.h3,
      bold: true,
      color: COLORS.text,
      fontFace: "Arial",
      align: "left",
    });

    const projectsBase64 = charts.projects.toString("base64");
    slide.addImage({
      data: `data:image/png;base64,${projectsBase64}`,
      x: MARGIN_X + COL_W + SPACING.betweenCards,
      y: START_Y + 0.22 + 0.12,
      w: COL_W,
      h: CHART_H,
    });
  }
}

/**
 * Slide 5 : Décisions clés & Focus (décisions pleine largeur en haut, focus en dessous)
 */
async function addDecisionsFocusSlide(
  pptx: PptxGenJS,
  decisions: MonthlyReviewExportData["highlights"]["keyDecisions"],
  focus: MonthlyReviewExportData["highlights"]["nextMonthFocus"],
  helpers: { addLogo: (slide: Slide, pptx: PptxGenJS) => Promise<void>; addCard: (slide: Slide, x: number, y: number, w: number, h: number, options?: { accent?: boolean }) => void; truncate: (text: string, maxChars: number) => string }
): Promise<void> {
  const slide = pptx.addSlide();

  // Logo PILOTYS
  await helpers.addLogo(slide, pptx);

  // Titre slide (18pt, bien cadré, positionné sous le logo)
  const TITLE_Y = LOGO_Y + LOGO_H + 0.15; // Positionné sous le logo avec espacement
  slide.addText("Décisions clés & Focus", {
    x: MARGIN_X,
    y: TITLE_Y,
    w: CONTENT_W,
    h: 0.35,
    fontSize: TYPO.h2,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  const START_Y = TITLE_Y + 0.35 + SPACING.titleToContent;
  const AVAILABLE_H = Math.min(SLIDE_H - START_Y - MARGIN_BOTTOM, CONTENT_H - (START_Y - MARGIN_TOP)); // Garantit que ça ne dépasse pas
  
  // Diviser l'espace : 55% pour décisions, 45% pour focus (ajusté pour tenir)
  const DECISIONS_SECTION_H = Math.min(AVAILABLE_H * 0.55, SLIDE_H - START_Y - MARGIN_BOTTOM - 0.5);
  const FOCUS_SECTION_H = Math.min(AVAILABLE_H * 0.45 - SPACING.betweenSections, SLIDE_H - (START_Y + DECISIONS_SECTION_H + SPACING.betweenSections) - MARGIN_BOTTOM);

  // SECTION HAUTE : Décisions clés (pleine largeur)
  const DECISIONS_Y = START_Y;
  helpers.addCard(slide, MARGIN_X, DECISIONS_Y, CONTENT_W, DECISIONS_SECTION_H);

  // Filtrer et dédupliquer les décisions
  const validDecisions = decisions
    .filter((d) => d.title && d.title.trim().length > 0)
    .filter((d) => !d.title.toLowerCase().includes("actions à réaliser"));

  const uniqueDecisions: typeof validDecisions = [];
  const seenTitles = new Set<string>();
  for (const decision of validDecisions) {
    const normalized = decision.title.trim().toLowerCase().replace(/\s+/g, " ");
    if (!seenTitles.has(normalized)) {
      seenTitles.add(normalized);
      uniqueDecisions.push(decision);
    }
  }

  // Grouper les décisions par projet
  const decisionsByProject = new Map<string, typeof uniqueDecisions>();
  uniqueDecisions.forEach((decision) => {
    const projectName = decision.projectName || "Sans projet";
    if (!decisionsByProject.has(projectName)) {
      decisionsByProject.set(projectName, []);
    }
    decisionsByProject.get(projectName)!.push(decision);
  });

  // Titre section décisions
  const DECISIONS_TITLE_Y = DECISIONS_Y + 0.12;
  slide.addText("Décisions clés", {
    x: MARGIN_X + 0.12,
    y: DECISIONS_TITLE_Y,
    w: CONTENT_W - 0.24,
    h: 0.2,
    fontSize: TYPO.h3,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  // Calculer l'espace disponible pour les items décisions
  const DECISIONS_CONTENT_START = DECISIONS_TITLE_Y + 0.2 + 0.1;
  const DECISIONS_CONTENT_H = DECISIONS_SECTION_H - (DECISIONS_CONTENT_START - DECISIONS_Y) - 0.12;
  
  // Afficher les décisions groupées par projet
  let currentY = DECISIONS_CONTENT_START;
  const PROJECT_SPACING = 0.15;
  const DECISION_SPACING = 0.08;
  
  Array.from(decisionsByProject.entries()).forEach(([projectName, projectDecisions], projectIndex) => {
    if (currentY + 0.3 > DECISIONS_Y + DECISIONS_SECTION_H - 0.12) return; // Ne pas dépasser
    
    // Titre du projet (en gras)
    slide.addText(projectName, {
      x: MARGIN_X + 0.16,
      y: currentY,
      w: CONTENT_W - 0.32,
      h: 0.2,
      fontSize: TYPO.body,
      bold: true,
      color: COLORS.text,
      fontFace: "Arial",
      align: "left",
    });
    
    currentY += 0.2 + 0.05;
    
    // Décisions du projet
    projectDecisions.forEach((decision) => {
      if (currentY + 0.15 > DECISIONS_Y + DECISIONS_SECTION_H - 0.12) return; // Ne pas dépasser
      
      // Texte de la décision (sans carte individuelle, juste le texte)
      slide.addText(helpers.truncate(decision.title, 120), {
        x: MARGIN_X + 0.2,
        y: currentY,
        w: CONTENT_W - 0.4,
        h: 0.15,
        fontSize: TYPO.body,
        color: COLORS.text,
        fontFace: "Arial",
        align: "left",
        lineSpacing: 1.2,
        valign: "top",
      });
      
      currentY += 0.15 + DECISION_SPACING;
    });
    
    currentY += PROJECT_SPACING - DECISION_SPACING;
  });

  // SECTION BASSE : Focus mois suivant (pleine largeur, réduit)
  const FOCUS_Y = DECISIONS_Y + DECISIONS_SECTION_H + SPACING.betweenSections;
  helpers.addCard(slide, MARGIN_X, FOCUS_Y, CONTENT_W, FOCUS_SECTION_H);

  // Titre section focus (réduit)
  const FOCUS_TITLE_Y = FOCUS_Y + 0.12;
  slide.addText("Focus mois suivant", {
    x: MARGIN_X + 0.12,
    y: FOCUS_TITLE_Y,
    w: CONTENT_W - 0.24,
    h: 0.2,
    fontSize: TYPO.h3,
    bold: true,
    color: COLORS.text,
    fontFace: "Arial",
    align: "left",
  });

  // Liste de bullets (réduits pour tenir sur la page)
  const FOCUS_CONTENT_START = FOCUS_TITLE_Y + 0.2 + 0.1;
  const FOCUS_CONTENT_H = FOCUS_SECTION_H - (FOCUS_CONTENT_START - FOCUS_Y) - 0.12;
  const focusItems = focus.slice(0, 6);
  const FOCUS_ITEM_SPACING = 0.08; // Réduit
  const FOCUS_ITEM_H = focusItems.length > 0 ? (FOCUS_CONTENT_H - (focusItems.length - 1) * FOCUS_ITEM_SPACING) / focusItems.length : 0.35;

  focusItems.forEach((item, i) => {
    const y = FOCUS_CONTENT_START + i * (FOCUS_ITEM_H + FOCUS_ITEM_SPACING);

    slide.addText(`• ${helpers.truncate(item.title, 100)}`, {
      x: MARGIN_X + 0.16,
      y: y,
      w: CONTENT_W - 0.32,
      h: FOCUS_ITEM_H,
      fontSize: 11, // Réduit de 12 à 11
      color: COLORS.text,
      fontFace: "Arial",
      lineSpacing: 1.15,
      valign: "top",
    });
  });
}

/**
 * Génère le PPT complet pour Monthly Review
 * Design premium - Identité visuelle PILOTYS professionnelle
 */
export async function generateMonthlyReviewPpt(
  data: MonthlyReviewExportData,
  charts: ChartBuffers
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  
  // Définir le format de slide standard (16:9) avec dimensions exactes
  pptx.layout = "LAYOUT_16x9";
  pptx.defineLayout({ name: "CUSTOM_16x9", width: 10, height: 7.5 });
  pptx.layout = "CUSTOM_16x9";

  // Helpers (logo intégré en dur - toujours présent sur chaque slide)
  const helpers = {
    addLogo: (slide: Slide) => addLogo(slide, pptx),
    addCard: (slide: Slide, x: number, y: number, w: number, h: number, options?: { accent?: boolean }) => addCard(pptx, slide, x, y, w, h, options),
    truncate,
  };

  // 5 slides dans l'ordre narratif
  // Récupérer le nom d'utilisateur depuis les données si disponible
  const userName = (data as any).userName || undefined;
  await addCoverSlide(pptx, data.period.label, helpers, userName);
  await addExecutiveKpiSlide(pptx, data.summary, data.kpis, helpers);
  await addActivityChartSlide(pptx, charts, helpers); // Slide 3 : Premier graphique
  await addStatusProjectsChartSlide(pptx, charts, helpers); // Slide 4 : Deux autres graphiques
  await addDecisionsFocusSlide(
    pptx,
    data.highlights.keyDecisions,
    data.highlights.nextMonthFocus,
    helpers
  );

  // Générer le buffer
  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return buffer;
}
