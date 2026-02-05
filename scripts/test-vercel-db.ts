/**
 * Script pour tester la connexion à la base de données avec la même config que Vercel
 * Utilise les variables d'environnement de .env.local (qui devrait être synchronisé avec Vercel)
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function testVercelDatabase() {
  console.log("🔍 Test de la connexion à la base de données (config Vercel)...\n");

  // Charger .env.local explicitement
  const envLocalPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf-8");
    envContent.split("\n").forEach((line: string) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Supprimer les guillemets
          value = value.replace(/^["']|["']$/g, "");
          process.env[key] = value;
        }
      }
    });
    console.log("✅ Variables d'environnement chargées depuis .env.local\n");
  } else {
    console.log("⚠️  .env.local non trouvé, utilisation des variables d'environnement système\n");
  }

  // Vérifications
  console.log("📋 Configuration:");
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) + "..." : "❌ NON DÉFINIE"}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "non défini"}`);
  console.log(`   FLOWPILOT_JWT_SECRET: ${process.env.FLOWPILOT_JWT_SECRET ? "✅ Défini" : "❌ Non défini"}\n`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL n'est pas définie");
    console.log("\n💡 Pour récupérer les variables Vercel:");
    console.log("   vercel env pull .env.local");
    process.exit(1);
  }

  // Vérifier le format
  const isPostgres = 
    process.env.DATABASE_URL.startsWith("postgresql://") ||
    process.env.DATABASE_URL.startsWith("postgres://");
  const isSqlite = process.env.DATABASE_URL.startsWith("file:");
  const hasPlaceholders = 
    process.env.DATABASE_URL.includes("xxx") ||
    process.env.DATABASE_URL.includes("user:password") ||
    process.env.DATABASE_URL.includes("dbname");

  console.log("🔍 Analyse de DATABASE_URL:");
  console.log(`   Format PostgreSQL: ${isPostgres ? "✅" : "❌"}`);
  console.log(`   Format SQLite: ${isSqlite ? "⚠️  (ne devrait pas être SQLite en production)" : "✅"}`);
  console.log(`   Contient des placeholders: ${hasPlaceholders ? "❌ (xxx, user:password, dbname)" : "✅"}\n`);

  if (hasPlaceholders) {
    console.error("❌ DATABASE_URL contient des placeholders !");
    console.log("   Remplacez-les par votre vraie Connection String Neon");
    process.exit(1);
  }

  // Test de connexion
  console.log("🔄 Test de connexion...");
  try {
    await prisma.$connect();
    console.log("✅ Connexion réussie\n");

    // Vérifier les tables
    console.log("🔄 Vérification des tables...");
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Table 'User' existe (${userCount} utilisateur(s))`);
    } catch (error: any) {
      console.error(`❌ Table 'User' n'existe pas: ${error.message}`);
      console.log("   Code d'erreur:", error.code);
      console.log("\n💡 Solution: Appliquez les migrations");
      console.log("   npm run db:deploy");
    }

    try {
      const projectCount = await prisma.project.count();
      console.log(`✅ Table 'Project' existe (${projectCount} projet(s))`);
    } catch (error: any) {
      console.error(`❌ Table 'Project' n'existe pas: ${error.message}`);
      console.log("   Code d'erreur:", error.code);
      console.log("\n💡 Solution: Appliquez les migrations");
      console.log("   npm run db:deploy");
    }

    // Test de requête
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Les requêtes fonctionnent");
    } catch (error: any) {
      console.error(`❌ Erreur lors d'une requête: ${error.message}`);
      console.log("   Code d'erreur:", error.code);
    }

    await prisma.$disconnect();
    console.log("\n✅ Tous les tests sont passés !");
  } catch (error: any) {
    console.error("\n❌ Erreur de connexion:");
    console.error(`   Code: ${error.code || "N/A"}`);
    console.error(`   Message: ${error.message}`);

    if (error.code === "P1000") {
      console.log("\n💡 Erreur P1000: Authentification échouée");
      console.log("   - Vérifiez que le mot de passe dans DATABASE_URL est correct");
      console.log("   - Régénérez le mot de passe sur Neon si nécessaire");
    } else if (error.code === "P1001") {
      console.log("\n💡 Erreur P1001: Serveur inaccessible");
      console.log("   - Vérifiez que DATABASE_URL ne contient pas de placeholders");
      console.log("   - Vérifiez que votre projet Neon est actif");
    } else if (error.code === "P1003") {
      console.log("\n💡 Erreur P1003: Base de données n'existe pas");
      console.log("   - Vérifiez le nom de la base de données dans DATABASE_URL");
    } else if (error.code === "P1012") {
      console.log("\n💡 Erreur P1012: Erreur de schéma");
      console.log("   - Les migrations ne sont pas appliquées");
      console.log("   - Exécutez: npm run db:deploy");
    }

    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testVercelDatabase().catch((error) => {
  console.error("Erreur inattendue:", error);
  process.exit(1);
});

