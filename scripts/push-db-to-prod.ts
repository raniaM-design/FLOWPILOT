/**
 * Script pour pousser le schéma Prisma vers la base de données de production
 * Utilise DATABASE_URL_PROD ou DATABASE_URL selon la configuration
 * 
 * Usage:
 * 1. Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production
 * 2. Exécutez: npm run db:push-prod
 */

import { execSync } from "child_process";

// Les variables d'environnement sont déjà chargées par tsx depuis .env.local
const prodDatabaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error("❌ DATABASE_URL_PROD ou DATABASE_URL n'est pas définie");
  console.log("💡 Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production");
  process.exit(1);
}

// Vérifier que c'est bien une URL PostgreSQL
if (!prodDatabaseUrl.startsWith("postgresql://") && !prodDatabaseUrl.startsWith("postgres://")) {
  console.error("❌ DATABASE_URL_PROD doit être une URL PostgreSQL (postgresql:// ou postgres://)");
  console.log("💡 URL actuelle:", prodDatabaseUrl.substring(0, 30) + "...");
  process.exit(1);
}

console.log("🔄 Poussage du schéma Prisma vers la base de données de production...");
console.log("📊 URL:", prodDatabaseUrl.substring(0, 30) + "...");

try {
  // Utiliser prisma db push pour appliquer les changements directement
  // Cela fonctionne même sans migrations formelles
  execSync(`npx prisma db push --accept-data-loss --skip-generate`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: prodDatabaseUrl,
    },
  });

  console.log("✅ Schéma poussé avec succès vers la base de données de production");
  console.log("💡 Le champ isCompanyAdmin a été ajouté à la table User");
} catch (error: any) {
  console.error("❌ Erreur lors du push du schéma:", error.message);
  process.exit(1);
}

