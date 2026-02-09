/**
 * Script pour ajouter les champs OAuth à la table User sur Vercel
 * Utilisé pendant le build Vercel pour s'assurer que les champs OAuth existent
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addOAuthFieldsOnVercel() {
  console.log('🔧 Vérification des champs OAuth sur Vercel...\n');

  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL non définie, skip de la vérification OAuth');
    return;
  }

  try {
    await prisma.$connect();

    // Vérifier si les colonnes existent déjà
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND table_schema = 'public'
      AND column_name IN ('authProvider', 'providerId', 'passwordHash');
    `;

    const existingColumns = columns.map(c => c.column_name);

    // Modifier passwordHash pour le rendre optionnel
    if (existingColumns.includes("passwordHash")) {
      const passwordHashNullable = await prisma.$queryRaw`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'passwordHash' 
        AND table_schema = 'public';
      `;
      
      if (passwordHashNullable[0]?.is_nullable === "NO") {
        console.log('➕ Modification de passwordHash pour le rendre optionnel...');
        await prisma.$executeRaw`
          ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
        `;
        console.log('✅ Colonne passwordHash est maintenant optionnelle');
      }
    }

    // Ajouter authProvider si manquant
    if (!existingColumns.includes("authProvider")) {
      console.log('➕ Ajout de la colonne authProvider...');
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "authProvider" TEXT;
      `;
      console.log('✅ Colonne authProvider ajoutée');
    }

    // Ajouter providerId si manquant
    if (!existingColumns.includes("providerId")) {
      console.log('➕ Ajout de la colonne providerId...');
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "providerId" TEXT;
      `;
      console.log('✅ Colonne providerId ajoutée');
    }

    // Créer l'index composite (ignore si existe déjà)
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "User_authProvider_providerId_idx" ON "User"("authProvider", "providerId");
      `;
    } catch (error) {
      // Ignore si l'index existe déjà
    }

    // Créer la contrainte unique composite (ignore si existe déjà)
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_authProvider_providerId_key" 
        ON "User"("authProvider", "providerId") 
        WHERE "authProvider" IS NOT NULL AND "providerId" IS NOT NULL;
      `;
    } catch (error) {
      // Ignore si la contrainte existe déjà
    }

    console.log('\n✅ Vérification des champs OAuth terminée');
  } catch (error) {
    console.error('⚠️  Erreur lors de la vérification OAuth:', error.message);
    // Ne pas faire échouer le build si la vérification échoue
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

addOAuthFieldsOnVercel().catch((e) => {
  console.error('⚠️  Erreur inattendue lors de la vérification OAuth:', e.message);
  // Ne pas faire échouer le build
});

