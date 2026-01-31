/**
 * Script pour vérifier les données locales d'un utilisateur
 * Usage: npm run check-local-data rania.moutawafiq@hotmail.fr
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npm run check-local-data <email>");
    process.exit(1);
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await prisma.user.findMany();
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur: ${user.email} (ID: ${user.id})\n`);

    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      include: {
        decisions: true,
        actions: true,
        meetings: true,
      },
    });

    console.log(`📁 Projets: ${projects.length}`);
    console.log(`🎯 Décisions: ${projects.reduce((sum, p) => sum + p.decisions.length, 0)}`);
    console.log(`✅ Actions: ${projects.reduce((sum, p) => sum + p.actions.length, 0)}`);
    console.log(`📅 Réunions: ${projects.reduce((sum, p) => sum + p.meetings.length, 0)}\n`);

    if (projects.length > 0) {
      console.log("📁 Détails des projets:");
      projects.forEach((project, i) => {
        console.log(`\n  ${i + 1}. ${project.name}`);
        console.log(`     Décisions: ${project.decisions.length}`);
        console.log(`     Actions: ${project.actions.length}`);
        console.log(`     Réunions: ${project.meetings.length}`);
      });
    }
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

