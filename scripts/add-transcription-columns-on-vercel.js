/**
 * Script pour ajouter les tables et colonnes manquantes sur Vercel
 * - MeetingTranscriptionJob: colonnes consentRecording, consentProcessing, consentDate, audioDeletedAt, deletedAt
 * - PageView: table complète si absente
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTranscriptionColumnsOnVercel() {
  console.log('🔧 Vérification des objets DB manquants...\n');

  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL non définie, skip');
    return;
  }

  try {
    await prisma.$connect();

    // 1. PageView - créer la table si elle n'existe pas
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'PageView';
    `;
    if (!tables || tables.length === 0) {
      console.log('➕ Création de la table PageView...');
      try {
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "PageView" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "path" TEXT NOT NULL,
          "referer" TEXT,
          "userAgent" TEXT,
          "ipAddress" TEXT,
          "country" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
        )`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_userId_idx" ON "PageView"("userId")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_path_idx" ON "PageView"("path")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt")`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PageView_userId_path_idx" ON "PageView"("userId", "path")`);
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE "PageView" ADD CONSTRAINT "PageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        } catch (e) {
          if (!e.message?.includes('already exists')) console.warn('   FK PageView_userId:', e.message);
        }
        console.log('✅ Table PageView créée');
      } catch (err) {
        console.error('   Erreur création PageView:', err.message);
      }
    }

    // 2. MeetingTranscriptionJob - ajouter colonnes manquantes
    const columns = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'MeetingTranscriptionJob' AND table_schema = 'public';
    `;
    const existingColumns = (columns || []).map(c => c.column_name);

    const toAdd = [
      { name: 'consentRecording', sql: 'ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "consentRecording" BOOLEAN NOT NULL DEFAULT false;' },
      { name: 'consentProcessing', sql: 'ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "consentProcessing" BOOLEAN NOT NULL DEFAULT false;' },
      { name: 'consentDate', sql: 'ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "consentDate" TIMESTAMP(3);' },
      { name: 'audioDeletedAt', sql: 'ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "audioDeletedAt" TIMESTAMP(3);' },
      { name: 'deletedAt', sql: 'ALTER TABLE "MeetingTranscriptionJob" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);' },
    ];

    for (const col of toAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`➕ Ajout de la colonne ${col.name}...`);
        try {
          await prisma.$executeRawUnsafe(col.sql);
          console.log(`✅ Colonne ${col.name} ajoutée`);
        } catch (err) {
          if (err.message?.includes('already exists')) {
            console.log(`   (colonne ${col.name} existe déjà)`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('⚠️  Erreur:', error.message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

addTranscriptionColumnsOnVercel().catch((e) => {
  console.error('⚠️  Erreur inattendue:', e.message);
});
