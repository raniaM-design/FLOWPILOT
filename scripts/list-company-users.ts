/**
 * Script pour lister les utilisateurs et leurs entreprises
 * Usage: npm run list-company-users
 */

import { prisma } from "../lib/db";

async function main() {
  try {
    console.log("🔍 Récupération des utilisateurs et leurs entreprises...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        companyId: true,
        isCompanyAdmin: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: [
        { companyId: "asc" },
        { email: "asc" },
      ],
    });

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé");
      return;
    }

    // Grouper par entreprise
    const usersByCompany = new Map<string, typeof users>();
    const usersWithoutCompany: typeof users = [];

    for (const user of users) {
      if (user.companyId) {
        if (!usersByCompany.has(user.companyId)) {
          usersByCompany.set(user.companyId, []);
        }
        usersByCompany.get(user.companyId)!.push(user);
      } else {
        usersWithoutCompany.push(user);
      }
    }

    // Afficher les utilisateurs avec entreprise
    if (usersByCompany.size > 0) {
      console.log("📊 UTILISATEURS PAR ENTREPRISE:\n");
      
      for (const [companyId, companyUsers] of usersByCompany.entries()) {
        const company = companyUsers[0].company;
        console.log(`🏢 ${company?.name || "Sans nom"} (${company?.domain || "pas de domaine"})`);
        console.log(`   ID: ${companyId}`);
        console.log(`   Membres: ${companyUsers.length}\n`);
        
        for (const user of companyUsers) {
          const adminBadge = user.isCompanyAdmin ? "👑 ADMIN" : "   Membre";
          console.log(`   ${adminBadge} - ${user.email}`);
        }
        console.log("");
      }
    }

    // Afficher les utilisateurs sans entreprise
    if (usersWithoutCompany.length > 0) {
      console.log("👤 UTILISATEURS SANS ENTREPRISE:\n");
      for (const user of usersWithoutCompany) {
        console.log(`   ${user.email}`);
      }
      console.log("");
    }

    console.log(`\n💡 Pour promouvoir un utilisateur en admin entreprise:`);
    console.log(`   npm run promote-company-admin <email>`);
    console.log(`\n   Exemple:`);
    console.log(`   npm run promote-company-admin ${users[0]?.email || "email@example.com"}`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

