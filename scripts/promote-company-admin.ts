/**
 * Script pour promouvoir un utilisateur au rôle administrateur d'entreprise
 * Usage: npm run promote-company-admin email@example.com
 */

import { prisma } from "../lib/db";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npm run promote-company-admin <email>");
    console.error("   Exemple: npm run promote-company-admin rania.moutawafiq@hotmail.fr");
    process.exit(1);
  }

  try {
    console.log(`🔍 Recherche de l'utilisateur: ${email}...`);

    // Rechercher l'utilisateur (insensible à la casse)
    const normalizedEmail = email.toLowerCase().trim();
    const allUsers = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        companyId: true,
        isCompanyAdmin: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    if (!user.companyId) {
      console.error(`❌ L'utilisateur ${user.email} n'est pas membre d'une entreprise`);
      console.error(`💡 L'utilisateur doit d'abord créer ou rejoindre une entreprise`);
      process.exit(1);
    }

    if (user.isCompanyAdmin) {
      console.log(`ℹ️  L'utilisateur ${user.email} est déjà administrateur de l'entreprise "${user.company?.name || 'N/A'}"`);
      process.exit(0);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
    console.log(`📊 Entreprise: ${user.company?.name || 'N/A'} (ID: ${user.companyId})`);
    console.log(`📊 Statut admin actuel: ${user.isCompanyAdmin ? 'Oui' : 'Non'}`);

    // Promouvoir au rôle admin entreprise
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        isCompanyAdmin: true,
      },
    });

    console.log(`\n✅ ${user.email} a été promu administrateur d'entreprise avec succès!`);
    console.log(`\n💡 L'utilisateur peut maintenant gérer les membres de l'entreprise "${user.company?.name || 'N/A'}"`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

