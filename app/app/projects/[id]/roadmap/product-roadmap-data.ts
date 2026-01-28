/**
 * Données de la roadmap produit PILOTYS
 * Structure : items positionnés par axe et période
 */

export type RoadmapAxis = "produit" | "ux" | "technique" | "strategie";

export type RoadmapItemType = "MVP" | "Beta" | "V1" | "Critical" | "Feature" | "Improvement";

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  axis: RoadmapAxis;
  startMonth: string; // Format: "2025-03" pour mars 2025
  endMonth?: string; // Optionnel pour les items qui s'étalent sur plusieurs mois
  type: RoadmapItemType;
  status?: "completed" | "in-progress" | "planned";
}

export const roadmapItems: RoadmapItem[] = [
  // Axe Produit
  {
    id: "meetings-stabilization",
    title: "Stabilisation de Meetings",
    description: "Finalisation et stabilisation de la fonctionnalité d'analyse des réunions",
    axis: "produit",
    startMonth: "2025-01",
    endMonth: "2025-02",
    type: "MVP",
    status: "in-progress",
  },
  {
    id: "meetings-history",
    title: "Historique des analyses",
    description: "Conservation et consultation de l'historique des analyses de réunions",
    axis: "produit",
    startMonth: "2025-03",
    type: "Feature",
    status: "planned",
  },
  {
    id: "collaborative-roadmap",
    title: "Roadmap collaborative",
    description: "Partage et collaboration sur les roadmaps de projet",
    axis: "produit",
    startMonth: "2025-04",
    type: "Feature",
    status: "planned",
  },
  
  // Axe UX
  {
    id: "meetings-redesign",
    title: "Refonte des pages Meetings",
    description: "Amélioration de l'interface et de l'expérience utilisateur",
    axis: "ux",
    startMonth: "2025-01",
    endMonth: "2025-02",
    type: "Improvement",
    status: "completed",
  },
  {
    id: "forms-improvement",
    title: "Amélioration des formulaires",
    description: "Optimisation de la création et édition d'actions et décisions",
    axis: "ux",
    startMonth: "2025-02",
    type: "Improvement",
    status: "in-progress",
  },
  {
    id: "readability-improvement",
    title: "Lisibilité des actions & décisions",
    description: "Amélioration de la hiérarchie visuelle et de la clarté",
    axis: "ux",
    startMonth: "2025-03",
    type: "Improvement",
    status: "planned",
  },
  
  // Axe Technique
  {
    id: "auth-security",
    title: "Sécurisation de l'authentification",
    description: "Renforcement de la sécurité et gestion des sessions",
    axis: "technique",
    startMonth: "2025-02",
    type: "Critical",
    status: "planned",
  },
  {
    id: "parsing-optimization",
    title: "Optimisation du parsing",
    description: "Amélioration de l'extraction et du traitement des données",
    axis: "technique",
    startMonth: "2025-01",
    endMonth: "2025-02",
    type: "Improvement",
    status: "in-progress",
  },
  {
    id: "llm-integration-prep",
    title: "Préparation intégration LLM",
    description: "Architecture et infrastructure pour l'intégration d'IA",
    axis: "technique",
    startMonth: "2025-04",
    type: "Feature",
    status: "planned",
  },
  
  // Axe Stratégie
  {
    id: "monetization-model",
    title: "Définition du modèle de monétisation",
    description: "Stratégie pricing et modèle économique",
    axis: "strategie",
    startMonth: "2025-03",
    type: "Critical",
    status: "planned",
  },
  {
    id: "user-testing",
    title: "Tests utilisateurs ciblés",
    description: "Recueil de feedback et validation produit",
    axis: "strategie",
    startMonth: "2025-02",
    endMonth: "2025-03",
    type: "Feature",
    status: "in-progress",
  },
  {
    id: "product-positioning",
    title: "Positionnement produit",
    description: "Définition de la proposition de valeur et du marché",
    axis: "strategie",
    startMonth: "2025-04",
    type: "Feature",
    status: "planned",
  },
];

/**
 * Configuration des axes de la roadmap
 */
export const roadmapAxes: Array<{
  id: RoadmapAxis;
  label: string;
  icon: string; // Nom de l'icône lucide-react
  color: string; // Couleur Tailwind pour les items
}> = [
  {
    id: "produit",
    label: "Produit / Fonctionnalités",
    icon: "Rocket",
    color: "blue",
  },
  {
    id: "ux",
    label: "Expérience utilisateur",
    icon: "Sparkles",
    color: "purple",
  },
  {
    id: "technique",
    label: "Technique / Qualité",
    icon: "Code",
    color: "emerald",
  },
  {
    id: "strategie",
    label: "Stratégie / Business",
    icon: "TrendingUp",
    color: "orange",
  },
];

/**
 * Périodes de la roadmap (mois à afficher)
 */
export const roadmapMonths = [
  { id: "2025-01", label: "Janvier", quarter: "Q1" },
  { id: "2025-02", label: "Février", quarter: "Q1" },
  { id: "2025-03", label: "Mars", quarter: "Q1" },
  { id: "2025-04", label: "Avril", quarter: "Q2" },
  { id: "2025-05", label: "Mai", quarter: "Q2" },
  { id: "2025-06", label: "Juin", quarter: "Q2" },
];

