/**
 * Script pour promouvoir un utilisateur au rôle support
 * Usage: npm run promote-support email@example.com
 */

import { prisma } from "../lib/db";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npm run promote-support <email>");
    console.error("   Exemple: npm run promote-support support@example.com");
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

    if (user.role === "SUPPORT" || user.role === "ADMIN") {
      console.log(`ℹ️  L'utilisateur ${user.email} a déjà les droits support (rôle: ${user.role})`);
      process.exit(0);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
    console.log(`📊 Rôle actuel: ${user.role}`);

    // Promouvoir au rôle support
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPPORT" },
    });

    console.log(`\n✅ ${user.email} a été promu support avec succès!`);
    console.log(`\n💡 L'utilisateur peut maintenant accéder à /support`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

