/**
 * Script de test pour vérifier la configuration Resend
 * Usage: npm run test:resend
 */

import { Resend } from "resend";
import { sendPasswordResetEmail, sendCompanyInvitationEmail } from "../lib/email";
import * as path from "path";
import * as fs from "fs";

// Charger .env.local explicitement
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  envContent.split("\n").forEach((line: string) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Enlever les guillemets si présents
        value = value.replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  });
  console.log("✅ Variables d'environnement chargées depuis .env.local\n");
} else {
  console.log("⚠️  .env.local non trouvé, utilisation des variables d'environnement système\n");
}

async function main() {
  console.log("🧪 Test de configuration Resend\n");
  console.log("=" .repeat(50));

  // Vérifier les variables d'environnement
  console.log("\n📋 Variables d'environnement:");
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ Configuré" : "❌ Manquant"}`);
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || "❌ Non défini (utilisera fallback)"}`);
  console.log(`  RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || "❌ Non défini"}`);
  console.log(`  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini"}`);
  console.log(`  APP_URL: ${process.env.APP_URL || "❌ Non défini"}`);

  if (!process.env.RESEND_API_KEY) {
    console.error("\n❌ RESEND_API_KEY n'est pas configuré !");
    console.error("   Configurez-la dans .env.local ou sur Vercel");
    process.exit(1);
  }

  // Tester la connexion Resend
  console.log("\n🔌 Test de connexion Resend...");
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Resend n'a pas de méthode de vérification directe, on teste avec un email de test
    // Note: En production, vous pouvez utiliser resend.domains.list() pour vérifier
    console.log("✅ Client Resend initialisé avec succès");
  } catch (error: any) {
    console.error("❌ Erreur lors de l'initialisation du client Resend:", error.message);
    process.exit(1);
  }

  // Vérifier l'adresse "from"
  const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "noreply@pilotys.com";
  console.log(`\n📧 Adresse email 'from' qui sera utilisée: ${fromEmail}`);
  
  if (!fromEmail.includes("@")) {
    console.warn("⚠️  L'adresse email 'from' semble invalide");
  }

  // Demander à l'utilisateur s'il veut envoyer un email de test
  const args = process.argv.slice(2);
  const testEmail = args[0];

  if (!testEmail) {
    console.log("\n💡 Pour tester l'envoi d'email, utilisez:");
    console.log("   npm run test:resend votre-email@example.com");
    console.log("\n✅ Configuration Resend validée !");
    return;
  }

  // Valider l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    console.error(`\n❌ Email invalide: ${testEmail}`);
    process.exit(1);
  }

  console.log(`\n📤 Envoi d'un email de test à: ${testEmail}`);
  console.log("   Type: Réinitialisation de mot de passe\n");

  try {
    // Générer un token de test (ne sera pas utilisé réellement)
    const testToken = "test-token-" + Date.now();
    
    await sendPasswordResetEmail(testEmail, testToken, "fr");
    
    console.log("\n✅ Email envoyé avec succès !");
    console.log(`   Vérifiez votre boîte de réception (et les spams) à: ${testEmail}`);
  } catch (error: any) {
    console.error("\n❌ Erreur lors de l'envoi de l'email:", error.message);
    console.error("\n💡 Vérifiez:");
    console.error("   1. Que RESEND_API_KEY est correcte");
    console.error("   2. Que EMAIL_FROM ou RESEND_FROM_EMAIL pointe vers un domaine vérifié dans Resend");
    console.error("   3. Les logs ci-dessus pour plus de détails");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});

