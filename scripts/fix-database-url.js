/**
 * Script pour corriger automatiquement DATABASE_URL dans .env.local
 * Supprime les placeholders et nettoie le format
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('🔧 Correction de DATABASE_URL dans .env.local...\n');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local n\'existe pas');
  console.log('   Exécutez: node scripts/create-env-template.js');
  process.exit(1);
}

// Lire le fichier
let envContent = fs.readFileSync(envLocalPath, 'utf-8');

// Trouver et nettoyer DATABASE_URL
const lines = envContent.split('\n');
let foundDatabaseUrl = false;
let databaseUrlLineIndex = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Chercher la ligne DATABASE_URL
  if (line.startsWith('DATABASE_URL') || line.match(/^DATABASE_URL\s*=/)) {
    foundDatabaseUrl = true;
    databaseUrlLineIndex = i;
    
    // Vérifier si c'est un placeholder
    if (line.includes('xxx') || line.includes('user:password') || line.includes('dbname')) {
      console.log('⚠️  Placeholder détecté dans DATABASE_URL');
      console.log(`   Ligne actuelle: ${line.substring(0, 80)}...\n`);
      
      console.log('📋 Pour corriger cela:');
      console.log('   1. Allez sur https://console.neon.tech');
      console.log('   2. Cliquez sur votre projet');
      console.log('   3. Allez dans "Connection Details"');
      console.log('   4. Copiez la Connection String complète');
      console.log('   5. Collez-la ci-dessous (ou appuyez sur Entrée pour quitter)\n');
      
      // Demander à l'utilisateur de saisir la vraie URL
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Collez votre Connection String Neon: ', (newUrl) => {
        rl.close();
        
        if (!newUrl || newUrl.trim().length === 0) {
          console.log('\n❌ Aucune URL fournie. Opération annulée.');
          console.log('   Vous pouvez éditer .env.local manuellement');
          process.exit(0);
        }
        
        // Nettoyer l'URL (supprimer les espaces, guillemets supplémentaires)
        newUrl = newUrl.trim().replace(/^["']|["']$/g, '');
        
        // Vérifier le format
        if (!newUrl.startsWith('postgresql://') && !newUrl.startsWith('postgres://')) {
          console.error('\n❌ Format invalide. L\'URL doit commencer par postgresql:// ou postgres://');
          process.exit(1);
        }
        
        // Remplacer la ligne
        lines[i] = `DATABASE_URL="${newUrl}"`;
        
        // Réécrire le fichier
        const newContent = lines.join('\n');
        fs.writeFileSync(envLocalPath, newContent, 'utf-8');
        
        console.log('\n✅ DATABASE_URL mise à jour !');
        console.log(`   ${newUrl.substring(0, 60)}...`);
        console.log('\n💡 Prochaines étapes:');
        console.log('   npm run db:check    # Vérifier la connexion');
        console.log('   npm run db:deploy   # Appliquer les migrations');
        
        process.exit(0);
      });
      
      return; // Sortir de la boucle
    }
  }
}

if (!foundDatabaseUrl) {
  console.log('⚠️  DATABASE_URL non trouvée dans .env.local');
  console.log('   Ajout d\'une ligne DATABASE_URL...\n');
  
  // Demander à l'utilisateur
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Collez votre Connection String Neon: ', (newUrl) => {
    rl.close();
    
    if (!newUrl || newUrl.trim().length === 0) {
      console.log('\n❌ Aucune URL fournie. Opération annulée.');
      process.exit(0);
    }
    
    newUrl = newUrl.trim().replace(/^["']|["']$/g, '');
    
    if (!newUrl.startsWith('postgresql://') && !newUrl.startsWith('postgres://')) {
      console.error('\n❌ Format invalide. L\'URL doit commencer par postgresql:// ou postgres://');
      process.exit(1);
    }
    
    // Ajouter à la fin du fichier
    const newContent = envContent + (envContent.endsWith('\n') ? '' : '\n') + `DATABASE_URL="${newUrl}"\n`;
    fs.writeFileSync(envLocalPath, newContent, 'utf-8');
    
    console.log('\n✅ DATABASE_URL ajoutée !');
    console.log(`   ${newUrl.substring(0, 60)}...`);
    console.log('\n💡 Prochaines étapes:');
    console.log('   npm run db:check    # Vérifier la connexion');
    console.log('   npm run db:deploy   # Appliquer les migrations');
    
    process.exit(0);
  });
  
} else {
  console.log('✅ DATABASE_URL trouvée et semble correcte');
  console.log('   Pas de placeholder détecté');
}

