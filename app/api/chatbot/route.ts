import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/flowpilot-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chatbot
 * Gère les messages du chatbot
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    const userMessage = message.toLowerCase().trim();
    const history = body.history || [];

    // Réponses prédéfinies améliorées avec contexte
    let response = "";

    // Salutations
    if (userMessage.match(/^(bonjour|salut|hello|hi|hey|bonsoir|bonne journée|bonne soirée)/i)) {
      response = "Bonjour ! Je suis l'assistant PILOTYS. Comment puis-je vous aider aujourd'hui ?";
    }
    // Au revoir
    else if (userMessage.match(/(au revoir|bye|à bientôt|goodbye|ciao|à plus|à tout à l'heure)/i)) {
      response = "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions. Bonne journée !";
    }
    // Merci
    else if (userMessage.match(/(merci|thank|thanks|thank you|parfait|super|génial)/i)) {
      response = "De rien ! Je suis là pour vous aider. Avez-vous d'autres questions sur PILOTYS ?";
    }
    // Questions sur PILOTYS - généralités
    else if (userMessage.match(/(qu'est-ce que|qu'est|what is|what's|explique|expliquer|décris|décrire).*pilotys/i)) {
      response = "PILOTYS est une plateforme de gestion de projets qui vous aide à reprendre le contrôle de vos décisions. Avec PILOTYS, vous pouvez :\n\n• Créer et gérer vos projets\n• Documenter vos décisions importantes\n• Suivre vos actions et tâches\n• Organiser vos réunions et extraire automatiquement les décisions et actions\n• Visualiser votre calendrier\n\nL'objectif est de vous aider à mieux structurer votre travail et à ne rien oublier.";
    }
    // Questions sur les projets
    else if (userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau).*projet/i) || 
             userMessage.match(/(projet|project).*(créer|faire|ajouter|nouveau|comment)/i)) {
      response = "Pour créer un projet dans PILOTYS :\n\n1. Allez dans la section 'Projets' (menu de gauche)\n2. Cliquez sur le bouton 'Nouveau projet'\n3. Remplissez les informations :\n   • Nom du projet\n   • Description (optionnelle)\n   • Dates de début et fin (optionnelles)\n4. Cliquez sur 'Créer'\n\nUne fois créé, vous pourrez y ajouter des décisions, actions et réunions.";
    }
    // Questions sur les actions
    else if (userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau).*action/i) || 
             userMessage.match(/(action|tâche|task).*(créer|faire|ajouter|nouveau|comment)/i)) {
      response = "Pour créer une action dans PILOTYS, vous avez plusieurs options :\n\n• Depuis un projet : Ouvrez le projet et cliquez sur 'Nouvelle action'\n• Depuis une décision : Les actions peuvent être liées à une décision\n• Depuis une réunion : Les actions peuvent être extraites automatiquement lors de l'analyse d'un compte rendu\n\nLors de la création, vous pouvez définir :\n• Le titre de l'action\n• La description\n• Le responsable\n• L'échéance\n• La priorité\n• Le statut (ouverte, en cours, terminée, bloquée)";
    }
    // Questions sur les décisions
    else if (userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau|prendre).*décision/i) || 
             userMessage.match(/(décision|decision).*(créer|faire|ajouter|nouveau|comment|prendre)/i)) {
      response = "Les décisions dans PILOTYS vous permettent de documenter les choix importants de vos projets.\n\nPour créer une décision :\n1. Allez dans un projet\n2. Cliquez sur 'Nouvelle décision'\n3. Remplissez :\n   • Le contexte (pourquoi cette décision est nécessaire)\n   • La décision prise\n   • L'impact potentiel\n   • Les actions associées (optionnel)\n\nLes décisions peuvent aussi être extraites automatiquement lors de l'analyse d'un compte rendu de réunion.";
    }
    // Questions sur les comptes rendus de réunion (priorité avant réunions générales)
    else if (userMessage.match(/(compte rendu|compte-rendu|cr de réunion|cr réunion|cr de meeting|cr meeting|minutes|procès-verbal|pv)/i)) {
      if (userMessage.match(/(audio|enregistrement|transcrire|transcription|mp3|wav)/i)) {
        response = "PILOTYS peut transcrire vos enregistrements audio de réunion ! 🎤\n\n**Comment utiliser la transcription audio :**\n\n1. Allez dans une réunion (nouvelle ou existante)\n2. Cliquez sur 'Importer' dans le champ compte rendu\n3. Sélectionnez l'onglet 'Audio'\n4. Uploadez votre fichier audio (MP3, WAV, WebM, OGG, M4A - max 25MB)\n5. PILOTYS va :\n   • Transcrire l'audio en texte (même si la qualité n'est pas parfaite)\n   • Améliorer et nettoyer le texte transcrit\n   • Générer un compte rendu professionnel structuré\n6. Vous pouvez ensuite utiliser l'analyse automatique pour extraire les décisions et actions\n\n**Note** : Cette fonctionnalité nécessite une clé API OpenAI (OPENAI_API_KEY).\n\n💡 Même les audios de qualité moyenne peuvent être traités grâce à l'amélioration automatique !";
      } else if (userMessage.match(/(comment|how|explique|créer|faire|ajouter|nouveau|saisir|enregistrer)/i)) {
        response = "Pour créer un compte rendu de réunion dans PILOTYS, vous avez plusieurs options :\n\n**Option 1 : Saisie manuelle**\n1. Allez dans 'Réunions' → Créez ou ouvrez une réunion\n2. Saisissez votre compte rendu dans le champ texte\n3. Cliquez sur 'Analyser' pour extraire automatiquement les décisions et actions\n\n**Option 2 : Import de fichier**\n1. Cliquez sur 'Importer' dans le champ compte rendu\n2. Choisissez : Coller du texte, Word (.docx), PDF (.pdf), ou **Audio** 🎤\n3. Le contenu est importé automatiquement\n\n**Option 3 : Transcription audio** 🎤\n1. Cliquez sur 'Importer' → Onglet 'Audio'\n2. Uploadez votre enregistrement audio\n3. PILOTYS transcrit et génère un compte rendu professionnel automatiquement\n\n💡 Astuce : Après l'import ou la transcription, utilisez l'analyse automatique pour extraire les décisions et actions !";
      } else {
        response = "Les comptes rendus de réunion dans PILOTYS permettent de :\n\n• Documenter ce qui s'est dit lors d'une réunion\n• **Transcrire des enregistrements audio** 🎤 (même de qualité moyenne)\n• Extraire automatiquement les décisions et actions grâce à l'IA\n• Transformer vos discussions en éléments actionnables\n• Ne rien oublier des points importants abordés\n\n**Méthodes disponibles :**\n• Saisie manuelle\n• Import de texte, Word ou PDF\n• **Transcription audio** (MP3, WAV, etc.)\n\nPour créer un compte rendu : Ouvrez une réunion et utilisez l'une de ces méthodes.";
      }
    }
    // Questions sur le calendrier et réunions
    else if (userMessage.match(/(calendrier|calendar|réunion|meeting|réunions|meetings)/i)) {
      if (userMessage.match(/(comment|how|explique).*(créer|faire|ajouter|nouveau)/i)) {
        response = "Pour créer une réunion dans PILOTYS :\n\n1. Allez dans la section 'Réunions' (menu de gauche)\n2. Cliquez sur 'Nouvelle réunion'\n3. Remplissez les détails :\n   • Titre de la réunion\n   • Date et heure\n   • Participants (vous pouvez mentionner des membres de votre équipe)\n   • Description\n4. Après la réunion, vous pouvez ajouter un compte rendu qui sera automatiquement analysé pour extraire les décisions et actions.";
      } else {
        response = "Le calendrier PILOTYS vous permet de :\n\n• Visualiser toutes vos réunions\n• Créer de nouvelles réunions\n• Ajouter des compte rendus de réunion\n• Analyser automatiquement les compte rendus pour extraire :\n  - Les décisions prises\n  - Les actions à réaliser\n  - Les points à clarifier\n\nLes réunions peuvent être liées à vos projets pour une meilleure organisation.";
      }
    }
    // Questions sur les priorités
    else if (userMessage.match(/(priorité|priority|urgent|important|prioriser)/i)) {
      response = "Dans PILOTYS, vous pouvez gérer les priorités de vos actions :\n\n• Les actions peuvent avoir différents niveaux de priorité\n• Le dashboard affiche vos actions prioritaires\n• Vous pouvez filtrer et trier les actions par priorité\n• Les actions urgentes sont mises en évidence pour ne pas être oubliées";
    }
    // Questions sur le dashboard
    else if (userMessage.match(/(dashboard|tableau de bord|accueil|home|page d'accueil)/i)) {
      response = "Le dashboard PILOTYS vous donne une vue d'ensemble de votre travail :\n\n• Vos actions prioritaires du jour\n• Les actions de la semaine\n• Les décisions à surveiller\n• Les projets en cours\n• Un aperçu de votre calendrier\n\nC'est votre point de départ pour organiser votre journée de travail.";
    }
    // Questions sur les entreprises/équipes
    else if (userMessage.match(/(entreprise|company|équipe|team|collaboration|collaborer)/i)) {
      response = "PILOTYS supporte la collaboration en équipe :\n\n• Vous pouvez créer ou rejoindre une entreprise\n• Les projets peuvent être partagés avec votre équipe\n• Les actions peuvent être assignées à différents membres\n• Les réunions peuvent inclure plusieurs participants\n• Les décisions sont visibles par toute l'équipe du projet";
    }
    // Questions sur l'export/partage
    else if (userMessage.match(/(export|exporter|télécharger|download|pdf|ppt|partager|share)/i)) {
      response = "PILOTYS vous permet d'exporter vos données :\n\n• Export PDF des projets, décisions et actions\n• Export PowerPoint pour les présentations\n• Partage de projets avec votre équipe\n• Génération de rapports\n\nCes fonctionnalités vous aident à communiquer efficacement sur vos projets.";
    }
    // Questions sur l'analyse de réunions
    else if (userMessage.match(/(analyser|analyse|extraction|extraire|ia|intelligence artificielle|automatique)/i)) {
      if (userMessage.match(/(réunion|meeting|compte rendu)/i)) {
        response = "L'analyse automatique des réunions dans PILOTYS fonctionne ainsi :\n\n1. **Créez ou ouvrez une réunion** dans la section Réunions\n2. **Ajoutez votre compte rendu** dans le champ dédié\n3. **Cliquez sur 'Analyser'** - PILOTYS utilise l'IA pour extraire :\n   ✓ Les décisions prises (avec contexte et impact)\n   ✓ Les actions à réaliser (avec responsables et échéances)\n   ✓ Les points à clarifier\n4. **Revoyez et validez** les résultats extraits\n5. **Ajoutez-les à votre projet** en un clic\n\n💡 Cette fonctionnalité vous fait gagner beaucoup de temps et garantit que rien n'est oublié de vos réunions !";
      } else {
        response = "PILOTYS utilise l'intelligence artificielle pour analyser automatiquement vos comptes rendus de réunion. L'analyseur extrait les décisions, actions et points à clarifier, vous permettant de transformer rapidement vos discussions en éléments actionnables pour vos projets.";
      }
    }
    // Aide générale
    else if (userMessage.match(/(aide|help|assistance|support|que puis|que peux|que peut|fonctionnalité|fonctionnalités|guide)/i)) {
      response = "Je peux vous aider avec toutes les fonctionnalités de PILOTYS :\n\n📋 **Projets** : Création, gestion et organisation\n✅ **Actions** : Suivi des tâches et priorités\n📅 **Calendrier** : Organisation des réunions\n💡 **Décisions** : Documentation des choix importants\n🤝 **Collaboration** : Travail en équipe\n📊 **Dashboard** : Vue d'ensemble de votre travail\n📄 **Exports** : PDF, PowerPoint, rapports\n🤖 **Analyse IA** : Extraction automatique depuis les réunions\n\nPosez-moi une question spécifique pour plus de détails !";
    }
    // Questions sur les notifications
    else if (userMessage.match(/(notification|notifications|alerte|alertes|rappel|rappels)/i)) {
      response = "PILOTYS vous notifie des événements importants :\n\n• Nouvelles actions assignées\n• Échéances approchant\n• Actions en retard\n• Nouvelles décisions dans vos projets\n• Invitations à rejoindre une entreprise\n\nVous pouvez gérer vos préférences de notifications dans vos paramètres.";
    }
    // Questions sur la recherche
    else if (userMessage.match(/(recherche|search|chercher|trouver|où est|où sont)/i)) {
      response = "PILOTYS dispose d'une fonctionnalité de recherche globale :\n\n• Recherchez dans tous vos projets\n• Trouvez rapidement des actions, décisions ou réunions\n• Filtrez par type, statut, date, etc.\n• La recherche est accessible depuis le menu principal\n\nUtilisez des mots-clés pour trouver rapidement ce que vous cherchez.";
    }
    // Détection de mots-clés supplémentaires pour améliorer la compréhension
    else if (userMessage.match(/(comment faire|comment on|comment je|comment créer|comment ajouter|comment gérer|comment utiliser|comment voir|comment modifier|comment supprimer|comment partager)/i)) {
      response = "Je peux vous guider étape par étape ! Pourriez-vous préciser ce que vous souhaitez faire ?\n\nPar exemple :\n• \"Comment créer un projet ?\"\n• \"Comment ajouter une action ?\"\n• \"Comment créer un compte rendu de réunion ?\"\n• \"Comment partager un projet avec mon équipe ?\"\n\nJe vous donnerai des instructions détaillées et claires !";
    }
    // Réponse par défaut avec suggestions contextuelles
    else {
      // Analyser le contexte de l'historique pour donner une réponse plus pertinente
      const lastMessages = history.slice(-3).map((m: any) => m.content?.toLowerCase() || "");
      const context = lastMessages.join(" ");
      
      // Détection de mots-clés dans la question actuelle
      const hasProjet = userMessage.includes("projet");
      const hasAction = userMessage.includes("action") || userMessage.includes("tâche") || userMessage.includes("task");
      const hasDecision = userMessage.includes("décision") || userMessage.includes("decision");
      const hasReunion = userMessage.includes("réunion") || userMessage.includes("meeting") || userMessage.includes("calendrier");
      const hasCompteRendu = userMessage.includes("compte rendu") || userMessage.includes("compte-rendu") || userMessage.includes("cr ");
      
      if (hasCompteRendu || context.includes("compte rendu")) {
        response = "Pour créer un compte rendu de réunion :\n\n1. Allez dans 'Réunions' (menu de gauche)\n2. Créez ou ouvrez une réunion\n3. Ajoutez votre compte rendu dans le champ texte\n4. Cliquez sur 'Analyser' pour extraire automatiquement les décisions et actions\n\nSouhaitez-vous plus de détails sur l'analyse automatique ?";
      } else if (hasProjet || context.includes("projet")) {
        response = "Je peux vous aider avec les projets PILOTYS !\n\n• **Créer un projet** : Allez dans 'Projets' → 'Nouveau projet'\n• **Gérer vos projets** : Ouvrez un projet pour voir ses décisions, actions et réunions\n• **Partager un projet** : Utilisez les paramètres du projet pour inviter votre équipe\n\nQue souhaitez-vous faire exactement avec vos projets ?";
      } else if (hasAction || context.includes("action") || context.includes("tâche")) {
        response = "Je peux vous aider avec les actions !\n\n• **Créer une action** : Depuis un projet, une décision ou une réunion\n• **Gérer les priorités** : Définissez le niveau d'urgence de vos actions\n• **Suivre vos actions** : Consultez le dashboard pour voir vos actions prioritaires\n\nQuelle action souhaitez-vous créer ou gérer ?";
      } else if (hasDecision || context.includes("décision")) {
        response = "Je peux vous aider avec les décisions !\n\n• **Documenter une décision** : Créez une décision dans un projet pour enregistrer un choix important\n• **Lier des actions** : Associez des actions à une décision pour suivre leur réalisation\n• **Comprendre l'impact** : Documentez l'impact potentiel de chaque décision\n\nVoulez-vous créer une nouvelle décision ou comprendre comment elles fonctionnent ?";
      } else if (hasReunion || context.includes("réunion") || context.includes("calendrier")) {
        response = "Je peux vous aider avec les réunions !\n\n• **Créer une réunion** : Allez dans 'Réunions' → 'Nouvelle réunion'\n• **Ajouter un compte rendu** : Ouvrez une réunion et collez votre compte rendu\n• **Analyser automatiquement** : Utilisez l'IA pour extraire les décisions et actions\n• **Voir le calendrier** : Allez dans 'Calendrier' pour une vue d'ensemble\n\nQue souhaitez-vous faire avec vos réunions ?";
      } else {
        response = "Je comprends votre question. Pourriez-vous être plus précis ?\n\nJe peux vous aider avec :\n\n📋 **Projets** : Création, gestion, partage\n✅ **Actions** : Création, priorités, suivi\n💡 **Décisions** : Documentation, impact, suivi\n📅 **Réunions** : Création, compte rendu, analyse automatique\n🤝 **Collaboration** : Équipes, partage, invitations\n📊 **Dashboard** : Vue d'ensemble, priorités\n📄 **Exports** : PDF, PowerPoint\n\nPosez-moi une question spécifique et je vous guiderai étape par étape !";
      }
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[chatbot] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du message" },
      { status: 500 }
    );
  }
}

