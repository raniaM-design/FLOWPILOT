/**
 * Script pour générer Prisma Client de manière sécurisée sur Windows
 * Gère les erreurs EPERM en attendant que le fichier soit libéré
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Génération du client Prisma...');

// Fonction pour attendre un peu
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour vérifier si un processus utilise le fichier
const isFileLocked = (filePath) => {
  try {
    // Essayer d'ouvrir le fichier en mode exclusif
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return false;
  } catch (error) {
    return error.code === 'EBUSY' || error.code === 'EPERM';
  }
};

async function generatePrisma() {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 secondes

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Tentative ${i + 1}/${maxRetries}...`);
      
      // Vérifier si le fichier est verrouillé
      const prismaClientPath = path.join(
        process.cwd(),
        'node_modules',
        '.prisma',
        'client',
        'query_engine-windows.dll.node'
      );

      if (fs.existsSync(prismaClientPath) && isFileLocked(prismaClientPath)) {
        console.log('⚠️  Le fichier Prisma est verrouillé, attente...');
        await sleep(retryDelay);
        continue;
      }

      // Essayer de générer
      execSync('npx prisma generate', {
        stdio: 'inherit',
        env: process.env,
        cwd: process.cwd(),
      });

      console.log('✅ Client Prisma généré avec succès');
      return;
    } catch (error) {
      if (error.message && error.message.includes('EPERM')) {
        console.log(`⚠️  Erreur EPERM (tentative ${i + 1}/${maxRetries}), nouvelle tentative dans ${retryDelay}ms...`);
        if (i < maxRetries - 1) {
          await sleep(retryDelay);
          continue;
        }
      }
      
      console.error('❌ Erreur lors de la génération:', error.message);
      
      if (i === maxRetries - 1) {
        console.log('\n💡 Solution:');
        console.log('   1. Arrêtez le serveur de développement (Ctrl+C)');
        console.log('   2. Exécutez: npm run db:generate');
        console.log('   3. Redémarrez le serveur: npm run dev');
        process.exit(1);
      }
    }
  }
}

generatePrisma().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

