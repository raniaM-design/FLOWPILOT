/**
 * Script de pré-build pour vérifier que DATABASE_URL est correctement configurée
 * Exécuté avant prisma generate pour éviter les erreurs de validation
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Sur Vercel, DATABASE_URL est requise
  if (process.env.VERCEL === "1") {
    console.error("❌ DATABASE_URL n'est pas définie");
    console.error("💡 Définissez DATABASE_URL dans les variables d'environnement Vercel");
    process.exit(1);
  }
  // En local, permettre le build sans DATABASE_URL (pour vérifier les erreurs TypeScript)
  console.warn("⚠️  DATABASE_URL n'est pas définie");
  console.warn("💡 Le build continuera, mais certaines fonctionnalités nécessiteront DATABASE_URL");
  console.log("✅ Continuation du build...");
  process.exit(0);
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

// Vérifier que l'URL PostgreSQL est valide
if (isPostgres) {
  try {
    const url = new URL(databaseUrl);
    if (!url.hostname || !url.pathname) {
      console.error("❌ DATABASE_URL PostgreSQL invalide (hostname ou pathname manquant)");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ DATABASE_URL PostgreSQL n'est pas une URL valide");
    console.error(`   Erreur: ${error.message}`);
    process.exit(1);
  }
}

console.log("✅ DATABASE_URL est correctement configurée");
console.log(`   Format: ${isPostgres ? "PostgreSQL" : "SQLite"}`);
if (isPostgres) {
  try {
    const url = new URL(databaseUrl);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Database: ${url.pathname.replace("/", "")}`);
  } catch {
    // Ignore
  }
}

