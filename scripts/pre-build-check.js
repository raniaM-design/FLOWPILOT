/**
 * Script de pré-build pour vérifier que DATABASE_URL est correctement configurée
 * Exécuté avant prisma generate pour éviter les erreurs de validation
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL n'est pas définie");
  console.error("💡 Définissez DATABASE_URL dans les variables d'environnement Vercel");
  process.exit(1);
}

// Vérifier le format de l'URL
const isPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
const isSqlite = databaseUrl.startsWith("file:");

if (!isPostgres && !isSqlite) {
  console.error("❌ DATABASE_URL doit commencer par 'postgresql://', 'postgres://' ou 'file:'");
  console.error(`   Format actuel: ${databaseUrl.substring(0, 50)}...`);
  process.exit(1);
}

// En production (Vercel), forcer PostgreSQL
if (process.env.VERCEL === "1" && isSqlite) {
  console.error("❌ SQLite n'est pas supporté sur Vercel");
  console.error("💡 Utilisez PostgreSQL en production");
  process.exit(1);
}

console.log("✅ DATABASE_URL est correctement configurée");
console.log(`   Format: ${isPostgres ? "PostgreSQL" : "SQLite"}`);

