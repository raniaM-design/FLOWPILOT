/**
 * Script pour réinitialiser le mot de passe d'un utilisateur
 * Usage: npm run reset-password email@example.com nouveauMotDePasse
 * 
 * ⚠️ ATTENTION: Ce script modifie directement la base de données
 * Utilisez-le uniquement si vous avez perdu l'accès à votre compte
 */

import { prisma } from "../lib/db";
import { hashPassword } from "../lib/flowpilot-auth/password";

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("❌ Usage: npm run reset-password <email> <nouveau-mot-de-passe>");
    console.error("   Exemple: npm run reset-password rania.moutawafiq@hotmail.fr MonNouveauMotDePasse123");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("❌ Le mot de passe doit contenir au moins 8 caractères");
    process.exit(1);
  }

  try {
    console.log(`🔍 Recherche de l'utilisateur: ${email}...`);

    // Vérifier si l'utilisateur existe (recherche insensible à la casse)
    // Note: Prisma ne supporte pas directement la recherche case-insensitive
    // On va chercher tous les utilisateurs et filtrer
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

    // Hasher le nouveau mot de passe
    console.log("🔐 Hashage du nouveau mot de passe...");
    const passwordHash = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    console.log("💾 Mise à jour du mot de passe en base de données...");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log("✅ Mot de passe réinitialisé avec succès!");
    console.log(`\n📧 Email: ${user.email}`);
    console.log(`🔑 Nouveau mot de passe: ${newPassword}`);
    console.log("\n💡 Vous pouvez maintenant vous connecter avec ce nouveau mot de passe.");
    console.log("⚠️  N'oubliez pas de changer ce mot de passe après votre première connexion si nécessaire.");
  } catch (error: any) {
    console.error("❌ Erreur lors de la réinitialisation:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

