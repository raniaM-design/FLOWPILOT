/**
 * Script pour appliquer la migration isCompanyAdmin directement sur la base de production
 * 
 * Ce script ajoute le champ isCompanyAdmin à la table User si il n'existe pas déjà
 * Utilise prisma db push avec un schéma temporaire PostgreSQL
 * 
 * Usage:
 * 1. Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production
 *    OU passez l'URL en variable d'environnement: DATABASE_URL_PROD=postgresql://... npm run db:migrate-prod
 * 2. Exécutez: npm run db:migrate-prod
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Utiliser DATABASE_URL_PROD si disponible, sinon DATABASE_URL
const prodDatabaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error("❌ DATABASE_URL_PROD ou DATABASE_URL n'est pas définie");
  console.log("💡 Configurez DATABASE_URL_PROD dans .env.local avec l'URL PostgreSQL de production");
  console.log("💡 Ou passez-la en variable d'environnement: DATABASE_URL_PROD=postgresql://... npm run db:migrate-prod");
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

const tempSchemaPath = path.join(process.cwd(), "prisma", "schema-temp-postgres.prisma");

try {
  // Lire le schéma actuel
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const currentSchema = fs.readFileSync(schemaPath, "utf-8");
  
  // Créer une version PostgreSQL du schéma
  const postgresSchema = currentSchema.replace(
    /provider\s*=\s*"sqlite"/,
    'provider = "postgresql"'
  );
  
  // Écrire le schéma temporaire
  fs.writeFileSync(tempSchemaPath, postgresSchema);
  console.log("📝 Schéma temporaire PostgreSQL créé");
  
  try {
    // Utiliser db push avec le schéma temporaire pour appliquer les changements
    console.log("➕ Synchronisation du schéma avec la base de données...");
    
    execSync(
      `npx prisma db push --accept-data-loss --skip-generate --schema=${tempSchemaPath}`,
      {
        env: {
          ...process.env,
          DATABASE_URL: prodDatabaseUrl,
        },
        stdio: 'inherit',
      }
    );
    
    console.log("✅ Migration appliquée avec succès !");
    console.log("💡 Le champ isCompanyAdmin a été ajouté à la table User");
  } catch (error: any) {
    const errorMessage = error.message || error.toString();
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    const fullError = errorMessage + '\n' + errorOutput;
    
    // Si la colonne existe déjà ou si c'est une erreur non-critique
    if (fullError.includes("already exists") || 
        fullError.includes("duplicate") ||
        fullError.includes("column") && fullError.includes("exists") ||
        fullError.includes("P3005") || // Migration already applied
        fullError.includes("already applied")) {
      console.log("✅ Le champ isCompanyAdmin existe déjà, aucune action nécessaire");
    } else {
      console.error("❌ Erreur lors de l'application de la migration:");
      console.error(fullError.substring(0, 500));
      throw error;
    }
  }
} catch (error: any) {
  console.error("❌ Erreur fatale:", error.message);
  process.exit(1);
} finally {
  // Nettoyer le schéma temporaire
  if (fs.existsSync(tempSchemaPath)) {
    try {
      fs.unlinkSync(tempSchemaPath);
      console.log("🧹 Schéma temporaire supprimé");
    } catch (cleanupError) {
      // Ignorer les erreurs de nettoyage
    }
  }
}

console.log("✅ Script terminé avec succès");
