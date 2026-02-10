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

    // Réponses prédéfinies simples
    let response = "";

    // Salutations
    if (userMessage.match(/^(bonjour|salut|hello|hi|hey|bonsoir)/i)) {
      response = "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
    }
    // Questions sur PILOTYS
    else if (userMessage.match(/(qu'est-ce que|qu'est|what is|what's).*pilotys/i)) {
      response = "PILOTYS est une plateforme de gestion de projets qui vous aide à reprendre le contrôle de vos décisions. Vous pouvez créer des projets, prendre des décisions, suivre des actions et organiser vos réunions.";
    }
    // Questions sur les projets
    else if (userMessage.match(/(comment|how).*créer|créer.*projet/i)) {
      response = "Pour créer un projet, allez dans la section 'Projets' et cliquez sur 'Nouveau projet'. Remplissez les informations demandées et votre projet sera créé.";
    }
    // Questions sur les actions
    else if (userMessage.match(/(comment|how).*créer|créer.*action/i)) {
      response = "Pour créer une action, vous pouvez soit l'ajouter directement depuis un projet, soit depuis une décision ou une réunion. Cliquez sur 'Nouvelle action' et remplissez les détails.";
    }
    // Questions sur le calendrier
    else if (userMessage.match(/(calendrier|calendar|réunion|meeting)/i)) {
      response = "Le calendrier vous permet de visualiser toutes vos réunions. Vous pouvez créer de nouvelles réunions, les modifier ou les supprimer depuis cette section.";
    }
    // Aide générale
    else if (userMessage.match(/(aide|help|assistance|support)/i)) {
      response = "Je peux vous aider avec :\n• La création de projets\n• La gestion des actions\n• L'utilisation du calendrier\n• Les décisions\n• Toute autre question sur PILOTYS\n\nN'hésitez pas à me poser vos questions !";
    }
    // Questions sur les décisions
    else if (userMessage.match(/(décision|decision)/i)) {
      response = "Les décisions vous permettent de documenter les choix importants de vos projets. Créez une décision pour enregistrer le contexte, la décision prise et les actions associées.";
    }
    // Au revoir
    else if (userMessage.match(/(au revoir|bye|à bientôt|goodbye|ciao)/i)) {
      response = "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions. Bonne journée !";
    }
    // Merci
    else if (userMessage.match(/(merci|thank|thanks|thank you)/i)) {
      response = "De rien ! Je suis là pour vous aider. Avez-vous d'autres questions ?";
    }
    // Réponse par défaut
    else {
      response = "Je comprends votre question. Pourriez-vous être plus précis ? Je peux vous aider avec :\n• La création et gestion de projets\n• Les actions et tâches\n• Le calendrier et les réunions\n• Les décisions\n• Toute autre fonctionnalité de PILOTYS\n\nN'hésitez pas à me poser une question spécifique !";
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

