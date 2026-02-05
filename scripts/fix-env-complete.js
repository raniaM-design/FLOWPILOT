/**
 * Script pour corriger complètement .env.local
 * Nettoie et réorganise toutes les variables d'environnement
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local n\'existe pas');
  process.exit(1);
}

console.log('🔍 Lecture et correction de .env.local...');

let content = fs.readFileSync(envLocalPath, 'utf-8');
const originalContent = content;

// Parser toutes les variables d'environnement
const envVars = {};
const lines = content.split(/\r?\n/);
let currentKey = null;
let currentValue = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  
  // Ignorer les commentaires et lignes vides
  if (!line || line.startsWith('#')) {
    continue;
  }
  
  // Si la ligne contient un = et n'est pas une continuation
  if (line.includes('=') && !line.match(/^[A-Z_]+=/)) {
    // Sauvegarder la valeur précédente si elle existe
    if (currentKey) {
      let value = currentValue.trim();
      // Retirer les guillemets
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[currentKey] = value;
      currentKey = null;
      currentValue = '';
    }
    
    // Parser la nouvelle ligne
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      currentKey = match[1].trim();
      currentValue = match[2].trim();
      
      // Si la valeur commence par un guillemet mais ne se termine pas, c'est multi-ligne
      if ((currentValue.startsWith('"') && !currentValue.endsWith('"')) ||
          (currentValue.startsWith("'") && !currentValue.endsWith("'"))) {
        // Continuer à lire les lignes suivantes
        continue;
      } else {
        // Valeur complète sur une ligne
        let value = currentValue;
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[currentKey] = value;
        currentKey = null;
        currentValue = '';
      }
    }
  } else if (currentKey) {
    // Continuation d'une valeur multi-ligne
    currentValue += line;
    // Vérifier si on a atteint la fin (guillemet fermant)
    if ((currentValue.endsWith('"') && currentValue.startsWith('"')) ||
        (currentValue.endsWith("'") && currentValue.startsWith("'"))) {
      let value = currentValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[currentKey] = value;
      currentKey = null;
      currentValue = '';
    }
  }
}

// Sauvegarder la dernière valeur si elle existe
if (currentKey && currentValue) {
  let value = currentValue.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  envVars[currentKey] = value;
}

// Nettoyer DATABASE_URL : supprimer les sauts de ligne et caractères invalides
if (envVars.DATABASE_URL) {
  envVars.DATABASE_URL = envVars.DATABASE_URL
    .replace(/\r?\n/g, '')
    .replace(/\r/g, '')
    .trim();
  
  // Retirer tout ce qui vient après un guillemet fermant suivi de = (corruption)
  const corruptionMatch = envVars.DATABASE_URL.match(/^([^"]*"[^"]*")/);
  if (corruptionMatch) {
    envVars.DATABASE_URL = corruptionMatch[1].replace(/"/g, '');
  }
  
  // Vérifier que c'est bien une URL PostgreSQL
  if (!envVars.DATABASE_URL.startsWith('postgresql://') && 
      !envVars.DATABASE_URL.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL ne commence pas par postgresql:// ou postgres://');
    console.error('   Valeur actuelle:', envVars.DATABASE_URL.substring(0, 100));
    process.exit(1);
  }
}

// Reconstruire le fichier .env.local proprement
let newContent = '';
for (const [key, value] of Object.entries(envVars)) {
  // Mettre des guillemets autour des valeurs qui contiennent des caractères spéciaux
  let formattedValue = value;
  if (value.includes(' ') || value.includes('=') || value.includes('&') || value.includes('?')) {
    formattedValue = `"${value}"`;
  }
  newContent += `${key}=${formattedValue}\n`;
}

// Sauvegarder le fichier corrigé
fs.writeFileSync(envLocalPath, newContent, 'utf-8');

console.log('✅ .env.local corrigé et nettoyé !');
console.log(`   ${Object.keys(envVars).length} variables d'environnement trouvées`);
console.log('\n📋 Variables principales:');
if (envVars.DATABASE_URL) {
  console.log(`   DATABASE_URL: ${envVars.DATABASE_URL.substring(0, 50)}...`);
}
if (envVars.MICROSOFT_CLIENT_ID) {
  console.log(`   MICROSOFT_CLIENT_ID: ${envVars.MICROSOFT_CLIENT_ID.substring(0, 20)}...`);
}

console.log('\n💡 Vous pouvez maintenant exécuter:');
console.log('   npm run db:check');

