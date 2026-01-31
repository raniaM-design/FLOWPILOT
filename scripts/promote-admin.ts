/**
 * Script pour promouvoir un utilisateur au rôle administrateur
 * Usage: npm run promote-admin email@example.com
 */

import { prisma } from "../lib/db";
import { promoteToAdmin } from "../lib/flowpilot-auth/admin";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npm run promote-admin <email>");
    console.error("   Exemple: npm run promote-admin rania.moutawafiq@hotmail.fr");
    process.exit(1);
  }

  try {
    console.log(`🔍 Recherche de l'utilisateur: ${email}...`);

    // Rechercher l'utilisateur (insensible à la casse)
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
    });
    
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    if (user.role === "ADMIN") {
      console.log(`ℹ️  L'utilisateur ${user.email} est déjà administrateur`);
      process.exit(0);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
    console.log(`📊 Rôle actuel: ${user.role}`);

    // Promouvoir au rôle admin
    await promoteToAdmin(user.id);

    console.log(`\n✅ ${user.email} a été promu administrateur avec succès!`);
    console.log(`\n💡 L'utilisateur peut maintenant accéder à /admin`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

