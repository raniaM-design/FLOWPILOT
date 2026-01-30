/**
 * Script de test pour vérifier la configuration SMTP
 * Usage: npm run test:email
 */

import { testSMTPConnection, sendPasswordResetEmail } from "../lib/email";

async function main() {
  console.log("🧪 Test de la configuration SMTP...\n");

  // Vérifier les variables d'environnement
  console.log("📋 Variables d'environnement:");
  console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || "❌ Non défini"}`);
  console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || "❌ Non défini"}`);
  console.log(`  SMTP_USER: ${process.env.SMTP_USER || "❌ Non défini"}`);
  console.log(`  SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? "✅ Défini" : "❌ Non défini"}`);
  console.log(`  SMTP_FROM: ${process.env.SMTP_FROM || "❌ Non défini"}`);
  console.log(`  NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini"}`);
  console.log(`  APP_URL: ${process.env.APP_URL || "❌ Non défini"}`);
  console.log(`  VERCEL_URL: ${process.env.VERCEL_URL || "❌ Non défini"}\n`);

  // Test de connexion SMTP
  console.log("🔌 Test de connexion SMTP...");
  const connectionTest = await testSMTPConnection();
  
  if (!connectionTest.success) {
    console.error("❌ Échec de la connexion SMTP");
    console.error("Erreur:", connectionTest.error);
    console.error("\n💡 Vérifiez:");
    console.error("  1. Que SMTP_USER et SMTP_PASSWORD sont correctement configurés");
    console.error("  2. Que votre serveur SMTP est accessible");
    console.error("  3. Que les ports ne sont pas bloqués par un firewall");
    if (process.env.SMTP_HOST?.includes("gmail")) {
      console.error("  4. Pour Gmail: utilisez un 'Mot de passe d'application' (pas votre mot de passe normal)");
      console.error("     https://myaccount.google.com/apppasswords");
    }
    process.exit(1);
  }

  console.log("✅ Connexion SMTP réussie!\n");

  // Test d'envoi d'email (si un email de test est fourni)
  const testEmail = process.argv[2];
  if (testEmail) {
    console.log(`📧 Test d'envoi d'email à: ${testEmail}`);
    try {
      await sendPasswordResetEmail(testEmail, "test-token-12345", "fr");
      console.log("✅ Email de test envoyé avec succès!");
    } catch (error: any) {
      console.error("❌ Erreur lors de l'envoi de l'email de test:", error.message);
      process.exit(1);
    }
  } else {
    console.log("💡 Pour tester l'envoi d'email, exécutez:");
    console.log(`   npm run test:email votre@email.com`);
  }
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});

