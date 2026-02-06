/**
 * Filtre et nettoie les items extraits pour exclure les labels, métadonnées et éléments non pertinents
 */

/**
 * Liste des mots-clés à exclure (labels de métadonnées, etc.)
 */
const EXCLUDED_KEYWORDS = [
  // Labels de métadonnées
  "responsable",
  "responsables",
  "assigné",
  "assignée",
  "assignés",
  "assignées",
  "chargé",
  "chargée",
  "chargés",
  "chargées",
  "délégué",
  "déléguée",
  "délégués",
  "déléguées",
  "échéance",
  "échéances",
  "deadline",
  "deadlines",
  "date",
  "dates",
  "contexte",
  "contextes",
  "impact",
  "impacts",
  "bénéfice",
  "bénéfices",
  "conséquence",
  "conséquences",
  "effet",
  "effets",
  "risque",
  "risques",
  "avantage",
  "avantages",
  
  // Headers de sections à exclure
  "actions à engager",
  "actions à réaliser",
  "actions à faire",
  "actions",
  "action",
  "décisions prises",
  "décisions",
  "décision",
  "points abordés",
  "points",
  "point",
  "prochaines étapes",
  "prochaines",
  "prochaine",
  "prochainement",
  "étapes",
  "étape",
  "suivantes",
  "suivante",
  
  // Articles et mots-outils isolés
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "du",
  "de",
  "dans",
  "sur",
  "pour",
  "par",
  "avec",
  "sans",
  "sous",
  "au",
  "aux",
  "à",
  "en",
];

/**
 * Patterns pour détecter les labels de métadonnées (avec ou sans flèche)
 */
const METADATA_LABEL_PATTERNS = [
  /^(?:→|->|-)?\s*(?:responsable|assigné|chargé|délégué|échéance|deadline|date|contexte|impact|bénéfice|conséquence|effet|risque|avantage)\s*:?\s*$/i,
  /^(?:→|->|-)?\s*(?:responsables|assignés|chargés|délégués|échéances|deadlines|dates|contextes|impacts|bénéfices|conséquences|effets|risques|avantages)\s*:?\s*$/i,
];

/**
 * Patterns pour détecter les valeurs de métadonnées isolées (dates, noms courts, etc.)
 */
const METADATA_VALUE_PATTERNS = [
  // Métadonnées avec flèche (→ Responsable : X, → Échéance : Y)
  /^(?:→|->|-)\s*(?:responsable|assigné|chargé|délégué|échéance|deadline|date|contexte|impact|bénéfice|conséquence|effet|risque|avantage)\s*:?\s*.+$/i,
  // Dates courtes ou délais isolés
  /^(?:→|->|-)?\s*(?:dans|en|avant|après|le|pour|au|à)\s+\d+\s*(?:jour|jours|semaine|semaines|mois|année|années)$/i,
  /^(?:→|->|-)?\s*(?:dans|en|avant|après|le|pour|au|à)\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?:\s+prochain)?$/i,
  /^(?:→|->|-)?\s*(?:cette|la|le)\s+(?:semaine|semaine\s+prochaine|mois|année)$/i,
  /^(?:→|->|-)?\s*(?:aujourd'hui|demain|hier|maintenant)$/i,
  /^(?:→|->|-)?\s*\d{1,2}[\/\-\.]\d{1,2}(?:\/\d{2,4})?$/,
  
  // Noms propres courts (probablement des responsables isolés)
  /^[A-Z][a-z]+$/,
  
  // Mots isolés très courts
  /^.{1,2}$/,
];

/**
 * Vérifie si un texte est un label de métadonnée à exclure
 */
export function isMetadataLabel(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  const cleaned = text.trim().toLowerCase();
  
  // Vérifier les mots-clés exclus
  if (EXCLUDED_KEYWORDS.includes(cleaned)) {
    return true;
  }

  // Vérifier les patterns de labels
  for (const pattern of METADATA_LABEL_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie si un texte est une valeur de métadonnée isolée à exclure
 */
export function isMetadataValue(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  const cleaned = text.trim();
  
  // Vérifier les patterns de valeurs de métadonnées
  for (const pattern of METADATA_VALUE_PATTERNS) {
    if (pattern.test(cleaned)) {
      return true;
    }
  }

  // Vérifier si c'est un nom propre très court (probablement un responsable isolé)
  if (/^[A-Z][a-z]+$/.test(cleaned) && cleaned.length < 15) {
    // Mais ne pas exclure si c'est une action qui commence par un nom propre
    // Ex: "Jean va préparer" n'est pas une valeur isolée
    return false;
  }

  return false;
}

/**
 * Vérifie si un texte est un item valide (pas un label ni une métadonnée)
 */
export function isValidItem(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  const cleaned = text.trim();
  
  // Longueur minimale
  if (cleaned.length < 5) {
    return false;
  }

  // Exclure les indicateurs temporels isolés
  const temporalIndicators = [
    "prochainement",
    "bientôt",
    "ultérieurement",
    "ensuite",
    "après",
    "plus tard",
  ];
  if (temporalIndicators.includes(cleaned.toLowerCase())) {
    return false;
  }

  // Exclure les labels de métadonnées
  if (isMetadataLabel(cleaned)) {
    return false;
  }

  // Exclure les valeurs de métadonnées isolées
  if (isMetadataValue(cleaned)) {
    return false;
  }

  // Exclure les lignes qui ne contiennent que des symboles/punctuation
  if (/^[\s\p{P}\p{S}]*$/u.test(cleaned)) {
    return false;
  }

  return true;
}

/**
 * Nettoie une liste d'items en excluant les labels et métadonnées
 */
export function filterValidItems(items: string[]): string[] {
  return items.filter(item => isValidItem(item));
}

