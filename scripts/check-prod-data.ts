/**
 * Script pour vérifier les données d'un utilisateur en production
 * Usage: npm run check-prod-data rania.moutawafiq@hotmail.fr
 */

import { PrismaClient } from "@prisma/client";

// Utiliser DATABASE_URL_PROD si définie, sinon DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_PROD || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npm run check-prod-data <email>");
    console.error("   Exemple: npm run check-prod-data rania.moutawafiq@hotmail.fr");
    process.exit(1);
  }

  try {
    console.log(`🔍 Vérification des données pour: ${email}\n`);
    console.log(`📦 Base de données: ${(process.env.DATABASE_URL_PROD || process.env.DATABASE_URL)?.substring(0, 50)}...\n`);

    // Rechercher l'utilisateur (insensible à la casse)
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log("\n📋 Utilisateurs existants en production:");
      allUsers.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email}`);
      });
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})\n`);

    // Compter les projets
    const projectsCount = await prisma.project.count({
      where: { ownerId: user.id },
    });
    console.log(`📁 Projets: ${projectsCount}`);

    // Compter les décisions
    const decisionsCount = await prisma.decision.count({
      where: { createdById: user.id },
    });
    console.log(`🎯 Décisions: ${decisionsCount}`);

    // Compter les actions
    const actionsCount = await prisma.actionItem.count({
      where: {
        OR: [
          { createdById: user.id },
          { assigneeId: user.id },
        ],
      },
    });
    console.log(`✅ Actions: ${actionsCount}`);

    // Compter les réunions
    const meetingsCount = await prisma.meeting.count({
      where: { ownerId: user.id },
    });
    console.log(`📅 Réunions: ${meetingsCount}\n`);

    // Afficher les détails des projets
    if (projectsCount > 0) {
      console.log("📁 Détails des projets:");
      const projects = await prisma.project.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      projects.forEach((project, i) => {
        console.log(`\n  ${i + 1}. ${project.name}`);
        console.log(`     ID: ${project.id}`);
        console.log(`     Statut: ${project.status}`);
        console.log(`     Créé le: ${project.createdAt.toLocaleString("fr-FR")}`);
        if (project.description) {
          console.log(`     Description: ${project.description.substring(0, 50)}...`);
        }
      });
    } else {
      console.log("⚠️  Aucun projet trouvé pour cet utilisateur");
      console.log("💡 Vous pouvez migrer les données locales avec: npm run migrate-data");
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

