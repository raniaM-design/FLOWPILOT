import type { ChatbotUserContext } from "./user-context";
import { pilotThreePartReply } from "./pilot-reply";

/**
 * Réponses règles + structure 3 phrases (réponse, action + lien /app/…, question).
 */
export function resolvePilotMessage(
  messageRaw: string,
  history: unknown[],
  ctx: ChatbotUserContext,
): string {
  const userMessage = messageRaw.toLowerCase().trim();
  const P = (
    getS1: (c: ChatbotUserContext) => string,
    s2: string,
    s3: string,
  ) => pilotThreePartReply(ctx, getS1, s2, s3);

  if (userMessage.match(/^(bonjour|salut|hello|hi|hey|bonsoir|bonne journée|bonne soirée)/i)) {
    return P(
      (c) =>
        c.overdueCount > 0
          ? `${c.firstName}, tu as ${c.overdueCount} action${c.overdueCount > 1 ? "s" : ""} en retard : je suis Pilot pour t’aider à débloquer ça vite`
          : `${c.firstName}, je suis Pilot, ton assistant dans PILOTYS`,
      "Ouvre /app pour l’accueil ou /app/actions?plan=overdue pour lister les retards",
      "On commence par tes actions ou par autre chose ?",
    );
  }

  if (userMessage.match(/(au revoir|bye|à bientôt|goodbye|ciao|à plus|à tout à l'heure)/i)) {
    return P(
      (c) => `${c.firstName}, à très vite sur PILOTYS`,
      "Tu retrouveras tout depuis /app à la prochaine connexion",
      "Tu veux un dernier rappel sur une fonction avant de partir ?",
    );
  }

  if (userMessage.match(/(merci|thank|thanks|thank you|parfait|super|génial)/i)) {
    return P(
      (c) => `${c.firstName}, avec plaisir`,
      "Enchaîne depuis /app (tableau de bord) ou /app/projects selon ton besoin",
      "Une autre question sur une fonction précise ?",
    );
  }

  if (userMessage.match(/(qu'est-ce que|qu'est|what is|what's|explique|expliquer|décris|décrire).*pilotys/i)) {
    return P(
      (c) =>
        `${c.firstName}, PILOTYS relie projets, décisions, actions et réunions, avec analyse IA des comptes rendus`,
      "Explore /app puis /app/projects ou /app/meetings selon ton objectif",
      "Tu préfères commencer par un projet ou par une réunion ?",
    );
  }

  if (
    userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau).*projet/i) ||
    userMessage.match(/(projet|project).*(créer|faire|ajouter|nouveau|comment)/i)
  ) {
    return P(
      (c) => `${c.firstName}, un projet regroupe décisions, actions et réunions au même endroit`,
      "Va sur /app/projects puis « Nouveau projet » pour en créer un",
      "Tu veux aussi inviter ton équipe sur ce projet ?",
    );
  }

  if (
    userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau).*action/i) ||
    userMessage.match(/(action|tâche|task).*(créer|faire|ajouter|nouveau|comment)/i)
  ) {
    return P(
      (c) =>
        c.overdueCount > 0
          ? `${c.firstName}, crée des actions depuis un projet ou une réunion analysée — et pense à traiter /app/actions?plan=overdue`
          : `${c.firstName}, tu peux créer une action depuis un projet, une décision ou après analyse d’une réunion`,
      "Raccourci : /app/actions/new pour une action rapide ou /app/actions pour la liste",
      "Tu pars d’un projet existant ou d’une nouvelle tâche isolée ?",
    );
  }

  if (
    userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau|prendre).*décision/i) ||
    userMessage.match(/(décision|decision).*(créer|faire|ajouter|nouveau|comment|prendre)/i)
  ) {
    return P(
      (c) => `${c.firstName}, une décision documente un choix important et peut porter des actions liées`,
      "Ouvre un projet puis « Nouvelle décision », ou /app/decisions/new",
      "Tu veux lier cette décision à une réunion déjà analysée ?",
    );
  }

  if (userMessage.match(/(compte rendu|compte-rendu|cr de réunion|cr réunion|cr de meeting|cr meeting|minutes|procès-verbal|pv)/i)) {
    if (userMessage.match(/(audio|enregistrement|transcrire|transcription|mp3|wav)/i)) {
      return P(
        (c) => `${c.firstName}, tu peux importer un audio sur une réunion : PILOTYS transcrit puis propose un CR structuré`,
        "Crée ou ouvre une réunion depuis /app/meetings puis importe l’audio dans le champ compte rendu",
        "Tu veux tester sur /app/meetings/new tout de suite ?",
      );
    }
    if (userMessage.match(/(comment|how|explique|créer|faire|ajouter|nouveau|saisir|enregistrer)/i)) {
      return P(
        (c) => `${c.firstName}, ajoute ton texte dans la réunion puis lance l’analyse pour extraire décisions et actions`,
        "Va sur /app/meetings, ouvre ou crée une réunion, puis « Analyser »",
        "Tu importes du texte, un PDF ou un audio ?",
      );
    }
    return P(
      (c) => `${c.firstName}, le compte rendu sert de base à l’extraction automatique de décisions et d’actions`,
      "Tout se passe dans /app/meetings après saisie ou import",
      "Tu préfères saisie manuelle ou import fichier ?",
    );
  }

  if (userMessage.match(/(calendrier|calendar|réunion|meeting|réunions|meetings)/i)) {
    if (userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau)/i)) {
      return P(
        (c) => `${c.firstName}, une réunion porte date, participants et compte rendu analysable`,
        "Crée-la via /app/meetings puis « Nouvelle réunion »",
        "Tu veux la rattacher à un projet tout de suite ?",
      );
    }
    return P(
      (c) => `${c.firstName}, le calendrier et les réunions se gèrent depuis l’app dédiée`,
      "Ouvre /app/meetings pour la liste ou /app/calendar pour la vue calendrier",
      "Tu cherches à planifier ou à analyser un CR existant ?",
    );
  }

  if (userMessage.match(/(priorité|priority|urgent|important|prioriser)/i)) {
    return P(
      (c) =>
        c.overdueCount > 0
          ? `${c.firstName}, tes retards sont le meilleur indicateur d’urgence : traite-les d’abord`
          : `${c.firstName}, les priorités se voient sur le tableau de bord et dans les actions`,
      "Filtre /app/actions?plan=overdue ou consulte /app pour les priorités",
      "Tu veux trier par échéance ou par projet ?",
    );
  }

  if (userMessage.match(/(dashboard|tableau de bord|accueil|home|page d'accueil)/i)) {
    return P(
      (c) => `${c.firstName}, le tableau de bord résume actions, décisions et projets qui comptent maintenant`,
      "C’est /app dès que tu es connecté",
      "Tu veux te concentrer sur les retards ou sur les décisions à risque ?",
    );
  }

  if (userMessage.match(/(entreprise|company|équipe|team|collaboration|collaborer)/i)) {
    return P(
      (c) => `${c.firstName}, PILOTYS permet entreprise, projets partagés et assignation d’actions`,
      "Paramètres équipe et invitations : /app/company ou fiche projet",
      "Tu configures une équipe ou tu invites sur un projet précis ?",
    );
  }

  if (userMessage.match(/(export|exporter|télécharger|download|pdf|ppt|partager|share)/i)) {
    return P(
      (c) => `${c.firstName}, tu peux exporter en PDF / présentation depuis les vues projet et revues`,
      "Ouvre un projet ou /app/review/weekly selon le type de rapport",
      "Tu veux un export projet ou une revue de période ?",
    );
  }

  if (userMessage.match(/(analyser|analyse|extraction|extraire|ia|intelligence artificielle|automatique)/i)) {
    if (userMessage.match(/(réunion|meeting|compte rendu)/i)) {
      return P(
        (c) => `${c.firstName}, l’analyse IA lit ton compte rendu et propose décisions, actions et points à clarifier`,
        "Dans /app/meetings, ouvre une réunion avec du texte puis clique « Analyser »",
        "Tu as déjà un CR prêt à coller ?",
      );
    }
    return P(
      (c) => `${c.firstName}, l’IA PILOTYS sert surtout à structurer tes réunions en éléments actionnables`,
      "Point d’entrée : /app/meetings",
      "Tu veux voir un exemple de flux complet ?",
    );
  }

  if (userMessage.match(/(aide|help|assistance|support|que puis|que peux|que peut|fonctionnalité|fonctionnalités|guide)/i)) {
    return P(
      (c) => `${c.firstName}, je couvre projets, actions, décisions, réunions, calendrier, exports et analyse IA`,
      "Navigation : /app pour l’ensemble, ou pose une question ciblée ici",
      "Tu veux une marche à suivre pour créer quoi en premier ?",
    );
  }

  if (userMessage.match(/(notification|notifications|alerte|alertes|rappel|rappels)/i)) {
    return P(
      (c) => `${c.firstName}, les notifications signalent assignations, échéances et événements importants`,
      "Réglages : /app/preferences (ou notifications selon ta version)",
      "Tu veux réduire le bruit ou activer plus d’alertes ?",
    );
  }

  if (userMessage.match(/(recherche|search|chercher|trouver|où est|où sont)/i)) {
    return P(
      (c) => `${c.firstName}, la recherche globale parcourt tes projets et contenus depuis la barre du haut`,
      "Utilise le champ recherche en haut de l’app (icône loupe)",
      "Tu cherches une action, une décision ou une réunion ?",
    );
  }

  if (
    userMessage.match(
      /(comment faire|comment on|comment je|comment créer|comment ajouter|comment gérer|comment utiliser|comment voir|comment modifier|comment supprimer|comment partager)/i,
    )
  ) {
    return P(
      (c) => `${c.firstName}, précise ce que tu veux faire et je te donne le lien direct`,
      "En attendant, /app et la barre latérale regroupent Projets, Actions, Réunions, Décisions",
      "Tu veux créer, modifier ou retrouver quel type d’élément ?",
    );
  }

  const lastMessages = history.slice(-3).map((m: unknown) => {
    const o = m as { content?: string };
    return o.content?.toLowerCase() || "";
  });
  const context = lastMessages.join(" ");

  const hasProjet = userMessage.includes("projet");
  const hasAction = userMessage.includes("action") || userMessage.includes("tâche") || userMessage.includes("task");
  const hasDecision = userMessage.includes("décision") || userMessage.includes("decision");
  const hasReunion =
    userMessage.includes("réunion") || userMessage.includes("meeting") || userMessage.includes("calendrier");
  const hasCompteRendu =
    userMessage.includes("compte rendu") ||
    userMessage.includes("compte-rendu") ||
    userMessage.includes("cr ");

  if (hasCompteRendu || context.includes("compte rendu")) {
    return P(
      (c) => `${c.firstName}, colle ton CR dans une réunion puis lance l’analyse pour générer décisions et actions`,
      "Étape : /app/meetings → ouvrir ou créer une réunion",
      "Tu veux aussi importer un PDF ou un audio ?",
    );
  }
  if (hasProjet || context.includes("projet")) {
    return P(
      (c) => `${c.firstName}, les projets regroupent décisions, actions et réunions liées`,
      "Liste et création : /app/projects",
      "Tu crées un nouveau projet ou tu en ouvres un existant ?",
    );
  }
  if (hasAction || context.includes("action") || context.includes("tâche")) {
    return P(
      (c) =>
        c.overdueCount > 0
          ? `${c.firstName}, commence par /app/actions?plan=overdue si tu veux dégager la pression`
          : `${c.firstName}, les actions vivent dans chaque projet et sur /app/actions`,
      "Création rapide : /app/actions/new",
      "Tu veux une action liée à une décision ou autonome ?",
    );
  }
  if (hasDecision || context.includes("décision")) {
    return P(
      (c) => `${c.firstName}, documente une décision pour garder le « pourquoi » et les suites`,
      "Création : /app/decisions/new ou depuis un projet",
      "Tu veux rattacher des actions tout de suite ?",
    );
  }
  if (hasReunion || context.includes("réunion") || context.includes("calendrier")) {
    return P(
      (c) => `${c.firstName}, les réunions accueillent ton CR et l’analyse IA`,
      "Va sur /app/meetings ou /app/calendar",
      "Tu planifies une nouvelle réunion ou tu analyses un CR existant ?",
    );
  }

  return P(
    (c) =>
      `${c.firstName}, reformule en une phrase ce que tu veux accomplir dans PILOTYS (créer, retrouver, analyser…)`,
    "Les sections clés sont /app, /app/projects, /app/actions et /app/meetings",
    "Tu parles plutôt d’actions, de réunions ou de décisions ?",
  );
}
