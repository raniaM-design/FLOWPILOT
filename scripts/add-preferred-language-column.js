const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Ajouter la colonne preferredLanguage si elle n'existe pas
    await prisma.$executeRawUnsafe(`
      ALTER TABLE User ADD COLUMN preferredLanguage TEXT;
    `);
    console.log('✅ Colonne preferredLanguage ajoutée avec succès');
  } catch (error) {
    // Si la colonne existe déjà, ignorer l'erreur
    if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
      console.log('ℹ️  La colonne preferredLanguage existe déjà');
    } else {
      console.error('❌ Erreur:', error.message);
      throw error;
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

