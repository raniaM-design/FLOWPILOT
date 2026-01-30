/**
 * Script pour lister tous les utilisateurs de la base de données
 * Usage: npm run list-users
 */

import { prisma } from "../lib/db";

async function main() {
  try {
    console.log("🔍 Recherche des utilisateurs dans la base de données...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé dans la base de données.");
      console.log("\n💡 Vous devez d'abord créer un compte via /signup");
    } else {
      console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Créé le: ${user.createdAt.toLocaleString("fr-FR")}`);
        console.log("");
      });
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

