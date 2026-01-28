/**
 * Thème PPT pour exports Monthly Review
 * Règles strictes de mise en page - AUCUNE modification du contenu
 */

export const PPT_THEME = {
  // Grille 16:9 (marges exactes)
  layout: {
    SLIDE_W: 13.33,
    SLIDE_H: 7.50,
    MARGIN_X: 0.70, // Gauche
    MARGIN_RIGHT: 0.70, // Droite
    MARGIN_TOP: 0.60, // Haut
    MARGIN_BOTTOM: 0.45, // Bas
    CONTENT_W: 11.93, // SLIDE_W - (MARGIN_X * 2)
    RADIUS: 10, // Rayon des cartes en points
  },

  // Typographie (tailles exactes)
  typography: {
    h1: 40, // Titre principal (cover)
    h2: 28, // Titre de slide
    h3: 16, // Titre de section
    body: 14, // Texte normal
    secondary: 11, // Texte secondaire
    meta: 10, // Méta (dates)
  },

  // Fonts
  fonts: {
    heading: "Arial",
    body: "Arial",
  },

  // Couleurs (UNIQUEMENT celles autorisées)
  colors: {
    background: "FFFFFF", // Fond slide
    text: "111111", // Texte principal
    muted: "667085", // Texte secondaire
    divider: "E5E7EB", // Séparateurs / bordures
    accent: "2563EB", // Accent unique (KPI, %)
  },

  // Espacements verticaux standard
  spacing: {
    titleToContent: 0.6, // Entre titre de slide et contenu
    betweenSections: 0.4, // Entre sections
    betweenLines: 0.18, // Entre lignes de texte
    betweenCards: 0.3, // Entre cartes
    betweenBullets: 0.25, // Entre bullets
  },

  // Cartes
  card: {
    borderWidth: 1, // 1px
    radius: 10, // Rayon en points
  },
} as const;

