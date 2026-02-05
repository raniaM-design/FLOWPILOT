/**
 * Script pour vérifier les variables d'environnement Vercel
 */

const { execSync } = require('child_process');

console.log('🔍 Vérification des variables d\'environnement Vercel...\n');

try {
  const output = execSync('vercel env ls', { encoding: 'utf-8' });
  console.log(output);
  
  // Vérifier si DATABASE_URL est présente
  if (output.includes('DATABASE_URL')) {
    console.log('\n✅ DATABASE_URL trouvée sur Vercel');
    console.log('\n💡 Pour la récupérer:');
    console.log('   vercel env pull .env.local --environment=production --yes');
  } else {
    console.log('\n❌ DATABASE_URL n\'est PAS sur Vercel');
    console.log('\n💡 Pour l\'ajouter:');
    console.log('   1. Obtenez votre Connection String Neon depuis https://console.neon.tech');
    console.log('   2. Ajoutez-la: vercel env add DATABASE_URL production');
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.log('\n💡 Assurez-vous que le projet est lié: vercel link --yes');
}

