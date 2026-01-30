/**
 * Script de diagnostic pour vérifier la connexion à la base de données
 * Usage: npx tsx scripts/check-db-connection.ts
 */

import { PrismaClient } from "@prisma/client";

async function checkConnection() {
  console.log("🔍 Vérification de la connexion à la base de données...\n");

  // Vérifier DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL n'est pas définie");
    console.log("\n💡 Pour définir DATABASE_URL:");
    console.log("  - Local: DATABASE_URL=file:./prisma/dev.db (SQLite)");
    console.log("  - Production: DATABASE_URL=postgresql://user:password@host:5432/database?schema=public");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL est définie");
  console.log(`   Format: ${databaseUrl.substring(0, 30)}...`);

  // Créer le client Prisma
  const prisma = new PrismaClient({
    log: ["error", "warn"],
  });

  try {
    // Test de connexion simple
    console.log("\n🔄 Test de connexion...");
    await prisma.$connect();
    console.log("✅ Connexion réussie");

    // Vérifier que les tables existent
    console.log("\n🔄 Vérification des tables...");
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Table 'User' existe (${userCount} utilisateur(s))`);
    } catch (error: any) {
      if (error.code === "P2021" || error.message.includes("does not exist")) {
        console.error("❌ Table 'User' n'existe pas");
        console.log("\n💡 Solution: Exécutez les migrations Prisma:");
        console.log("   npx prisma migrate deploy");
        console.log("   ou");
        console.log("   npx prisma db push");
      } else {
        throw error;
      }
    }

    try {
      const projectCount = await prisma.project.count();
      console.log(`✅ Table 'Project' existe (${projectCount} projet(s))`);
    } catch (error: any) {
      if (error.code === "P2021" || error.message.includes("does not exist")) {
        console.error("❌ Table 'Project' n'existe pas");
      } else {
        throw error;
      }
    }

    console.log("\n✅ Toutes les vérifications sont passées !");
  } catch (error: any) {
    console.error("\n❌ Erreur de connexion:");
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   Message: ${error.message}`);

    if (error.code === "P1001") {
      console.log("\n💡 La base de données n'est pas accessible.");
      console.log("   Vérifiez:");
      console.log("   - Que le serveur PostgreSQL est démarré");
      console.log("   - Que l'URL de connexion est correcte");
      console.log("   - Que le firewall autorise les connexions");
    } else if (error.code === "P1000") {
      console.log("\n💡 Erreur d'authentification.");
      console.log("   Vérifiez:");
      console.log("   - Le nom d'utilisateur");
      console.log("   - Le mot de passe");
      console.log("   - Les permissions de l'utilisateur");
    } else if (error.code === "P1003") {
      console.log("\n💡 La base de données n'existe pas.");
      console.log("   Créez la base de données:");
      console.log("   CREATE DATABASE nom_de_la_base;");
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection().catch((error) => {
  console.error("Erreur inattendue:", error);
  process.exit(1);
});

