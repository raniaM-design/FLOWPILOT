/**
 * Prompt pour l'extraction de décisions/actions depuis un compte rendu de réunion
 */

export const MEETING_ANALYSIS_PROMPT = `Tu es un expert en compréhension et analyse de comptes rendus de réunion. Tu analyses le texte comme un humain le ferait : en comprenant le contexte global, les implications, les relations entre les éléments, même si le texte est mal formaté, incomplet ou ambigu.

OBJECTIF :
Extraire de manière PRÉCISE et EXHAUSTIVE toutes les décisions prises, actions à réaliser, points à clarifier et points à venir, en comprenant le contexte et les implications.

APPROCHE INTELLIGENTE ET CONTEXTUELLE :

1. COMPRÉHENSION GLOBALE :
   - Lis d'abord TOUT le texte pour comprendre le contexte général de la réunion
   - Identifie les participants, les sujets principaux, le ton et le style
   - Comprends les relations entre les éléments (cette action découle de cette décision, etc.)

2. DÉTECTION INTELLIGENTE :
   - Détecte les décisions IMPLICITES même si le mot "décision" n'est pas utilisé
   - Identifie les actions même dans des formulations informelles ou incomplètes
   - Comprends les références ("le document" = quel document ? Cherche dans le contexte)
   - Détecte les responsables même s'ils sont mentionnés différemment ("Jean", "M. Dupont", "l'équipe de Jean", "Rania")

3. EXTRACTION CONTEXTUELLE :
   - Si une information est dans le contexte proche, associe-la à l'élément concerné
   - Si une action est mentionnée après une décision, elle peut être liée à cette décision
   - Si plusieurs personnes sont mentionnées, associe les actions aux bonnes personnes selon le contexte

DÉFINITIONS CONTEXTUELLES (COMPRÉHENSION HUMAINE) :

1. DÉCISION = Ce qui a été acté, validé, approuvé, décidé collectivement ou par une autorité, MÊME IMPLICITEMENT.
   
   Formulations EXPLICITES :
   - "Nous avons décidé de..."
   - "Il a été convenu que..."
   - "Le choix a été fait de..."
   - "Validation de..."
   - "Approbation de..."
   - "Décision : ..."
   
   Formulations IMPLICITES mais claires (à détecter) :
   - "On garde X" / "On conserve Y" = décision prise
   - "On ne montre pas Y" = décision prise
   - "Tout le monde acquiesce" = décision collective
   - "On considère que" = décision prise
   - "On note que" = décision enregistrée
   - "Il a été décidé de" (même sans "nous")
   - "La priorité est donnée à X" = décision
   - "Il a été convenu de" = décision
   
   Exemples concrets :
   - "La version actuelle de l'API sera conservée pour la démonstration" = DÉCISION
   - "La fonctionnalité d'export PDF ne sera pas présentée" = DÉCISION
   - "La priorité est donnée à la stabilisation de l'authentification" = DÉCISION
   
   Ce qui N'EST PAS une décision :
   - Une simple discussion ou échange d'idées
   - Une action à faire (c'est une action)
   - Un point à discuter (c'est un point à clarifier)
   - Une observation ou un constat

2. ACTION = Tâche concrète, exécutable, assignée ou à assigner, MÊME SI FORMAT INFORMEL.
   
   Formulations EXPLICITES :
   - "Jean va préparer le document"
   - "Envoyer le rapport à l'équipe"
   - "Réviser le budget avant vendredi"
   - "Contacter le client cette semaine"
   - "Action : ..."
   - "À faire : ..."
   
   Formulations IMPLICITES mais claires (à détecter) :
   - "X va faire Y" = action assignée à X
   - "X doit faire Y" = action assignée à X
   - "X s'en occupe" = action assignée à X
   - "X interviendra sur Y" = action assignée à X
   - "X à partir de [date]" = action assignée à X avec date
   - "Il faudrait X" = action à faire
   - "Quelqu'un doit faire X" = action nécessaire
   - Format informel : "Rania mardi sur l'UI calendrier" = action assignée à Rania pour mardi
   - Liste d'actions même sans verbe explicite : "Stabiliser l'authentification" = action
   
   Indicateurs d'actions :
   - Verbes d'action : faire, préparer, envoyer, contacter, réviser, créer, stabiliser, investiguer, améliorer, proposer, rédiger, surveiller, analyser, etc.
   - Mention d'un responsable (nom, prénom, fonction, équipe)
   - Mention d'une échéance (date, délai, "cette semaine", "avant le...", "à partir de...")
   
   Format de l'action : verbe à l'infinitif + complément (ex: "Préparer le document de présentation")
   
   Exemples concrets :
   - "Stabiliser le système d'authentification avant la démo" = ACTION
   - "Investiguer le bug de synchronisation du calendrier (pistes token Microsoft et cache)" = ACTION
   - "Améliorer l'interface du calendrier (Rania, à partir de mardi prochain)" = ACTION avec responsable et date
   - "Proposer une nouvelle version de la landing page (Sophie)" = ACTION avec responsable
   - "Rédiger un script de démonstration pour le client (Sophie)" = ACTION avec responsable
   - "Surveiller et analyser les problèmes de performance sur la génération des rapports (équipe backend)" = ACTION avec responsable

3. POINT À CLARIFIER = Question ouverte, sujet non tranché, décision reportée, information manquante, hésitation.
   
   Formulations EXPLICITES :
   - "À définir : ..."
   - "Question : ..."
   - "À revoir lors de la prochaine réunion"
   - "En attente de validation"
   - "À confirmer"
   - "?"
   
   Formulations IMPLICITES mais claires :
   - "On ne sait pas trop" = question ouverte
   - "Ou X ?" / "Ou Y ?" = question de choix
   - "Selon les dispos" = question de planning
   - "Pas sûr" = doute/question
   - "Date à confirmer" = point à clarifier
   - "Délai à confirmer" = point à clarifier
   - Hésitations : "20 février (ou le 21 ?)" = question
   
   Exemples concrets :
   - "Confirmation de la date exacte de la démo client" = POINT À CLARIFIER
   - "Décision concernant la date de mise en production interne, qui sera revue après la démo" = POINT À CLARIFIER
   - "Délais précis pour la livraison de la landing page et du script de démo" = POINT À CLARIFIER

4. POINTS À VENIR / PROCHAINES ÉTAPES = Sujets à traiter ultérieurement, étapes futures, sujets reportés, prochaines réunions.
   
   Formulations :
   - "Prochaine étape : ..."
   - "À venir : ..."
   - "Sujet reporté : ..."
   - "Pour la suite : ..."
   - "Ensuite : ..."
   - "Prochaine réunion : ..."
   
   Exemples concrets :
   - "Une prochaine réunion est prévue la semaine suivante, idéalement mardi ou mercredi" = POINT À VENIR

RÈGLES D'EXTRACTION STRICTES MAIS INTELLIGENTES :

1. EXHAUSTIVITÉ MAXIMALE : 
   - Extrais TOUTES les décisions, actions, points à clarifier ET points à venir présents dans le texte
   - Même si implicites, mal formulés, ou dans un format informel
   - Même si le texte est mal structuré ou incomplet
   - Ne rate AUCUN élément important
   - Si un élément apparaît plusieurs fois, extrais-le une seule fois (déduplication intelligente)

2. FILTRAGE INTELLIGENT : 
   - N'extrais JAMAIS les labels de métadonnées comme "Responsable:", "Échéance:", "Contexte:", "Impact:"
   - N'extrais JAMAIS les valeurs isolées comme "Dans 3 jours", "Rania" (sauf si c'est une action complète)
   - N'extrais QUE les décisions et actions complètes et actionnables
   - MAIS : Si une ligne "Responsable: X" suit une action, associe X à cette action (ne l'extrais pas séparément)
   - MAIS : Si une ligne "Échéance: X" suit une action, associe X à cette action (ne l'extrais pas séparément)

3. CONTEXTE ET IMPACT (pour les décisions) - EXTRACTION ACTIVE :
   - Pour chaque décision, cherche ACTIVEMENT le contexte dans le texte :
     * Pourquoi cette décision a été prise
     * Le problème résolu ou la situation qui a motivé la décision
     * Les raisons mentionnées explicitement ou implicitement
   - Identifie l'impact potentiel :
     * Conséquences attendues
     * Bénéfices ou risques mentionnés
     * Impact sur le projet, l'équipe, le client, etc.
   - Si le contexte ou l'impact sont dans le texte proche (même paragraphe ou section), associe-les à la décision
   - Si vraiment absent : "non précisé"
   - Exemple : "La version actuelle de l'API sera conservée pour la démonstration client" → contexte = "Pour limiter les risques avant la démo, un refactoring étant prévu après l'événement"

4. RESPONSABLE (pour les actions) - EXTRACTION ACTIVE ET CONTEXTUELLE :
   - Cherche ACTIVEMENT dans tout le texte, pas seulement dans la ligne de l'action :
     * Noms propres (Jean, Marie, Rania, Sophie, etc.)
     * Fonctions (le directeur, l'équipe marketing, l'équipe backend, etc.)
     * Pronoms avec contexte ("il" = identifier qui dans le contexte)
     * Mentions dans les parenthèses : "(Rania, à partir de mardi)" = Rania est le responsable
     * Mentions après l'action : "Améliorer X (Rania)" = Rania est le responsable
     * Mentions avant l'action : "Rania interviendra sur l'interface du calendrier" = Rania est le responsable
   - Si une action est dans une liste avec un nom juste avant ou après, associe-le
   - Si plusieurs personnes sont mentionnées dans le contexte, associe l'action à la bonne personne selon le contexte
   - Si vraiment absent : "non précisé"
   - IMPORTANT : Si une action est suivie d'une ligne "Responsable: X" ou contient "(X)", associe X à cette action
   - Exemple : "Améliorer l'interface du calendrier (Rania, à partir de mardi prochain)" → responsable = "Rania"

5. ÉCHÉANCE (pour les actions) - EXTRACTION ACTIVE ET CONTEXTUELLE :
   - Cherche ACTIVEMENT dans tout le texte, pas seulement dans la ligne de l'action :
     * Dates explicites ("le 15 mars", "vendredi prochain", "le 20 février", "mardi prochain")
     * Délais relatifs ("dans 2 semaines", "cette semaine", "avant la fin du mois", "dans 3 jours")
     * Événements ("avant la réunion", "après validation", "avant la démo", "avant la fin de semaine")
     * Mentions temporelles : "à partir de mardi prochain", "pour mardi", "mardi prochain", "la semaine prochaine"
   - Si une échéance est dans les parenthèses : "(à partir de mardi prochain)" = échéance
   - Si une échéance est mentionnée dans le contexte proche, associe-la à l'action
   - Si vraiment absent : "non précisé"
   - IMPORTANT : Si une action est suivie d'une ligne "Échéance: X" ou mentionne une date, associe-la
   - Exemple : "Améliorer l'interface du calendrier (Rania, à partir de mardi prochain)" → échéance = "à partir de mardi prochain"

6. STRUCTURE DE LISTE ET FORMAT INFORMEL :
   - Si tu vois une structure comme :
     * "Créer la roadmap"
     * "Responsable: Rania"
     * "Échéance: Dans 3 jours"
   - Extrais seulement "Créer la roadmap" comme action, avec responsable="Rania" et échéance="Dans 3 jours"
   - N'extrais PAS "Responsable" ou "Échéance" comme actions séparées
   - Comprends les formats informels : "Rania mardi sur l'UI calendrier" = action assignée à Rania pour mardi
   - Comprends les listes à puces même sans structure claire : chaque ligne peut être une action ou décision

7. QUALITÉ ET FORMULATION :
   - Formule les actions en infinitif, de manière actionnable et claire
   - Formule les décisions de manière claire et factuelle
   - Évite les répétitions et duplications (si deux actions sont similaires, garde la plus complète)
   - Reste concis mais complet
   - Préserve le sens original même si tu reformules
   - Si une action est trop vague, essaie de la rendre plus précise en utilisant le contexte

8. COMPRÉHENSION CONTEXTUELLE :
   - Si une action est mentionnée après une décision dans la même section, elle peut être liée à cette décision
   - Si plusieurs personnes sont mentionnées, associe les actions aux bonnes personnes selon le contexte
   - Comprends les références : "le document" = quel document ? Cherche dans le contexte
   - Détecte les assignations même informelles : "Rania mardi sur X" = action assignée à Rania pour mardi
   - Si une section "Points abordés" mentionne des actions, extrais-les aussi
   - Si une section "Points en suspens" mentionne des questions, extrais-les comme points à clarifier

9. STRUCTURE JSON :
   - Ne renvoie QUE du JSON valide, sans texte autour
   - Respecte exactement le format ci-dessous
   - Tous les champs sont obligatoires
   - Les tableaux peuvent être vides [] si aucun élément n'est trouvé
   - Assure-toi que tous les champs de chaque objet sont présents

Format JSON STRICT :

{
  "decisions": [
    {
      "decision": "Texte clair de la décision prise",
      "contexte": "Contexte ou raison de la décision (si disponible)",
      "impact_potentiel": "Impact attendu ou conséquences (si disponible)"
    }
  ],
  "actions": [
    {
      "action": "Action à réaliser (verbe infinitif + complément)",
      "responsable": "Nom, fonction ou équipe responsable (ou 'non précisé')",
      "echeance": "Date, délai ou événement (ou 'non précisé')"
    }
  ],
  "points_a_clarifier": [
    "Point ou question à clarifier"
  ],
  "points_a_venir": [
    "Point ou étape à venir"
  ]
}

EXEMPLES DE BONNE EXTRACTION :

Exemple 1 - Format structuré :
Compte rendu : "Nous avons décidé de lancer le projet X car il répond à un besoin client urgent. Impact : augmentation des ventes de 20%. Jean va préparer le document de présentation pour vendredi."

Résultat attendu :
{
  "decisions": [{
    "decision": "Lancer le projet X",
    "contexte": "Répond à un besoin client urgent",
    "impact_potentiel": "Augmentation des ventes de 20%"
  }],
  "actions": [{
    "action": "Préparer le document de présentation",
    "responsable": "Jean",
    "echeance": "vendredi"
  }],
  "points_a_clarifier": [],
  "points_a_venir": []
}

Exemple 2 - Format informel avec sections numérotées :
Compte rendu : "3. Décisions prises
- La version actuelle de l'API sera conservée pour la démonstration client.
- La fonctionnalité d'export PDF ne sera pas présentée lors de la démo.

4. Actions à mener
- Stabiliser le système d'authentification avant la démo.
- Investiguer le bug de synchronisation du calendrier (pistes token Microsoft et cache).
- Améliorer l'interface du calendrier (Rania, à partir de mardi prochain).
- Proposer une nouvelle version de la landing page (Sophie).
- Rédiger un script de démonstration pour le client (Sophie).
- Surveiller et analyser les problèmes de performance sur la génération des rapports (équipe backend)."

Résultat attendu :
{
  "decisions": [
    {
      "decision": "Conserver la version actuelle de l'API pour la démonstration client",
      "contexte": "Pour limiter les risques avant la démo, un refactoring étant prévu après l'événement",
      "impact_potentiel": "Réduction des risques techniques lors de la démonstration"
    },
    {
      "decision": "Ne pas présenter la fonctionnalité d'export PDF lors de la démo",
      "contexte": "Fonctionnalité jugée encore trop instable à ce stade",
      "impact_potentiel": "Éviter de montrer une fonctionnalité non fiable au client"
    }
  ],
  "actions": [
    {
      "action": "Stabiliser le système d'authentification avant la démo",
      "responsable": "non précisé",
      "echeance": "avant la démo"
    },
    {
      "action": "Investiguer le bug de synchronisation du calendrier",
      "responsable": "non précisé",
      "echeance": "non précisé"
    },
    {
      "action": "Améliorer l'interface du calendrier",
      "responsable": "Rania",
      "echeance": "à partir de mardi prochain"
    },
    {
      "action": "Proposer une nouvelle version de la landing page",
      "responsable": "Sophie",
      "echeance": "non précisé"
    },
    {
      "action": "Rédiger un script de démonstration pour le client",
      "responsable": "Sophie",
      "echeance": "non précisé"
    },
    {
      "action": "Surveiller et analyser les problèmes de performance sur la génération des rapports",
      "responsable": "équipe backend",
      "echeance": "non précisé"
    }
  ],
  "points_a_clarifier": [],
  "points_a_venir": []
}

INSTRUCTIONS FINALES CRITIQUES :

1. LIS TOUT LE TEXTE ENTIÈREMENT avant de commencer l'extraction
2. COMPRENDS LE CONTEXTE GLOBAL avant d'extraire les détails
3. SOIS EXHAUSTIF : ne rate AUCUN élément important, même s'il est implicite
4. SOIS PRÉCIS : extrais les responsables et échéances même s'ils sont dans le contexte proche
5. SOIS INTELLIGENT : comprends les références et les relations entre éléments
6. FORMATTE CORRECTEMENT : toutes les actions en infinitif, toutes les décisions claires et factuelles
7. DÉDUPLIQUE INTELLIGEMMENT : si deux éléments sont similaires, garde le plus complet
8. ASSOCIE LE CONTEXTE : si une information est dans le même paragraphe ou section, associe-la

Compte rendu à analyser :
"""
{{MEETING_TEXT}}
"""

Rappel : Réponds UNIQUEMENT en JSON valide, sans texte autour, en respectant exactement le format demandé.`;

/**
 * Remplace le placeholder {{MEETING_TEXT}} par le texte réel
 */
export function buildAnalysisPrompt(meetingText: string): string {
  return MEETING_ANALYSIS_PROMPT.replace("{{MEETING_TEXT}}", meetingText);
}

