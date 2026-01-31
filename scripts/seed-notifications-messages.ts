/**
 * Script pour générer des notifications et messages de test
 * Usage: npm run seed:notifications
 * 
 * ⚠️ Mode développement uniquement
 */

import { prisma } from "../lib/db";
import { createNotification } from "../lib/notifications/create";
import { createMessage } from "../lib/messages/create";

async function main() {
  console.log("🌱 Génération de données de test...\n");

  // Récupérer tous les utilisateurs
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.error("❌ Aucun utilisateur trouvé. Créez d'abord un compte.");
    process.exit(1);
  }

  console.log(`📧 ${users.length} utilisateur(s) trouvé(s)\n`);

  // Générer des notifications pour chaque utilisateur
  for (const user of users) {
    console.log(`📬 Génération pour ${user.email}...`);

    // Notifications variées
    const notifications = [
      {
        userId: user.id,
        kind: "action_assigned" as const,
        priority: "high" as const,
        title: "Nouvelle action assignée",
        body: "Vous avez été assigné à une nouvelle action dans le projet 'Site Web'",
        targetUrl: "/app",
        dedupeKey: `action_assigned_${user.id}_${Date.now()}`,
      },
      {
        userId: user.id,
        kind: "deadline_soon" as const,
        priority: "normal" as const,
        title: "Échéance proche",
        body: "L'action 'Réviser le design' arrive à échéance dans 2 jours",
        targetUrl: "/app",
        dedupeKey: `deadline_soon_${user.id}_${Date.now()}`,
      },
      {
        userId: user.id,
        kind: "export_ready" as const,
        priority: "low" as const,
        title: "Export prêt",
        body: "Votre export PDF est prêt à être téléchargé",
        targetUrl: "/app",
      },
      {
        userId: user.id,
        kind: "mention" as const,
        priority: "normal" as const,
        title: "Vous avez été mentionné",
        body: "Vous avez été mentionné dans une décision",
        targetUrl: "/app",
      },
      {
        userId: user.id,
        kind: "system" as const,
        priority: "low" as const,
        title: "Mise à jour système",
        body: "Nouvelle fonctionnalité disponible : notifications en temps réel",
        targetUrl: "/app",
      },
    ];

    for (const notif of notifications) {
      await createNotification(notif);
    }

    // Messages variés
    const messages = [
      {
        userId: user.id,
        type: "ai_summary" as const,
        subject: "Résumé de votre semaine",
        content: `Bonjour,

Voici un résumé de votre activité cette semaine :

📊 **Projets actifs** : 3
✅ **Actions complétées** : 12
📅 **Réunions** : 5
🎯 **Décisions prises** : 8

Continuez comme ça !

L'équipe PILOTYS`,
      },
      {
        userId: user.id,
        type: "product_announcement" as const,
        subject: "Nouvelle fonctionnalité : Notifications",
        content: `Bonjour,

Nous sommes ravis de vous annoncer une nouvelle fonctionnalité : le système de notifications !

Vous pouvez maintenant :
- Recevoir des alertes pour vos actions
- Être notifié des échéances
- Suivre les mentions et commentaires

Profitez-en !

L'équipe PILOTYS`,
      },
      {
        userId: user.id,
        type: "team_message" as const,
        subject: "Message de l'équipe",
        content: `Bonjour,

Nous espérons que vous appréciez PILOTYS. N'hésitez pas à nous faire part de vos retours !

L'équipe PILOTYS`,
      },
    ];

    for (const msg of messages) {
      await createMessage(msg);
    }

    console.log(`  ✅ 5 notifications et 3 messages créés\n`);
  }

  console.log("✅ Génération terminée !");
}

main()
  .catch((error) => {
    console.error("Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

