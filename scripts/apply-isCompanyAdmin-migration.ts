/**
 * Script pour appliquer la migration isCompanyAdmin directement sur la base de production
 * 
 * Ce script ajoute le champ isCompanyAdmin à la table User si il n'existe pas déjà
 * 
 * Usage:
 * 1. Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production
 *    OU passez l'URL en variable d'environnement: DATABASE_URL_PROD=postgresql://... npm run db:push-prod
 * 2. Exécutez: npm run db:push-prod
 */

import { PrismaClient } from "@prisma/client";

// Utiliser DATABASE_URL_PROD si disponible, sinon DATABASE_URL
const prodDatabaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error("❌ DATABASE_URL_PROD ou DATABASE_URL n'est pas définie");
  console.log("💡 Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production");
  console.log("💡 Ou passez-la en variable d'environnement: DATABASE_URL_PROD=postgresql://... npm run db:push-prod");
  process.exit(1);
}

// Vérifier que c'est bien une URL PostgreSQL
if (!prodDatabaseUrl.startsWith("postgresql://") && !prodDatabaseUrl.startsWith("postgres://")) {
  console.error("❌ DATABASE_URL_PROD doit être une URL PostgreSQL (postgresql:// ou postgres://)");
  console.log("💡 URL actuelle:", prodDatabaseUrl.substring(0, 50) + "...");
  console.log("💡 Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production");
  process.exit(1);
}

console.log("🔄 Application de la migration isCompanyAdmin...");
console.log("📊 Connexion à la base de données de production...");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodDatabaseUrl,
    },
  },
});

async function main() {
  try {
    // Vérifier si la colonne existe déjà
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'isCompanyAdmin'
      AND table_schema = 'public'
    `;

    if (result.length > 0) {
      console.log("✅ Le champ isCompanyAdmin existe déjà dans la table User");
      return;
    }

    // Ajouter la colonne isCompanyAdmin
    console.log("➕ Ajout du champ isCompanyAdmin à la table User...");
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN "isCompanyAdmin" BOOLEAN NOT NULL DEFAULT false
    `;

    console.log("✅ Migration appliquée avec succès !");
    console.log("💡 Le champ isCompanyAdmin a été ajouté à la table User");
  } catch (error: any) {
    console.error("❌ Erreur lors de l'application de la migration:", error.message);
    
    // Si la colonne existe déjà (erreur différente), c'est OK
    if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
      console.log("✅ Le champ isCompanyAdmin existe déjà, aucune action nécessaire");
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });

