/**
 * Script pour tester la configuration Google OAuth
 */
import { OAuth2Client } from "google-auth-library";
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
        value = value.replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  });
}

async function testGoogleOAuthConfig() {
  console.log("🔍 Test de la configuration Google OAuth...\n");

  // Vérifier les variables d'environnement
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log("📋 Variables d'environnement:");
  console.log(`  GOOGLE_CLIENT_ID: ${clientId ? clientId.substring(0, 30) + "..." : "❌ NON DÉFINI"}`);
  console.log(`  GOOGLE_CLIENT_SECRET: ${clientSecret ? "✅ Défini (" + clientSecret.length + " caractères)" : "❌ NON DÉFINI"}`);
  console.log();

  if (!clientId || !clientSecret) {
    console.error("❌ Variables d'environnement manquantes !");
    console.log("\n💡 Solution:");
    console.log("  1. Vérifiez que GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont dans .env.local");
    console.log("  2. Pour Vercel, vérifiez dans Settings > Environment Variables");
    process.exit(1);
  }

  // Vérifier le format du Client ID
  if (!clientId.includes(".apps.googleusercontent.com")) {
    console.error("❌ Format du Client ID invalide !");
    console.log("   Le Client ID doit se terminer par .apps.googleusercontent.com");
    process.exit(1);
  }

  // Tester différentes URLs de redirection
  const testUrls = [
    "http://localhost:3000/api/auth/google/callback",
    "https://localhost:3000/api/auth/google/callback",
  ];

  // Détecter l'environnement
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const origin = isProduction 
    ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://votre-domaine.vercel.app")
    : "http://localhost:3000";

  const redirectUri = `${origin}/api/auth/google/callback`;

  console.log("🌐 Configuration OAuth:");
  console.log(`  Environnement: ${isProduction ? "Production" : "Développement"}`);
  console.log(`  Origin: ${origin}`);
  console.log(`  Redirect URI: ${redirectUri}`);
  console.log();

  // Créer le client OAuth
  try {
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    // Générer l'URL d'autorisation pour tester
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
    });

    console.log("✅ Configuration OAuth valide !");
    console.log("\n📝 URLs à configurer dans Google Cloud Console:");
    console.log("\n1. Authorized JavaScript origins:");
    console.log(`   ${origin}`);
    console.log("\n2. Authorized redirect URIs:");
    console.log(`   ${redirectUri}`);
    console.log("\n3. Pour le développement local, ajoutez aussi:");
    console.log("   http://localhost:3000/api/auth/google/callback");
    console.log("\n🔗 URL d'autorisation générée:");
    console.log(`   ${authUrl.substring(0, 100)}...`);
    console.log("\n💡 Instructions:");
    console.log("  1. Allez sur https://console.cloud.google.com/");
    console.log("  2. APIs & Services > Credentials");
    console.log("  3. Cliquez sur votre OAuth 2.0 Client ID");
    console.log("  4. Ajoutez les URLs ci-dessus EXACTEMENT comme indiqué");
    console.log("  5. Cliquez sur Save");
    console.log("  6. Attendez 1-2 minutes pour que les changements soient propagés");
    console.log("  7. Testez à nouveau la connexion Google");

  } catch (error: any) {
    console.error("❌ Erreur lors de la création du client OAuth:");
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

testGoogleOAuthConfig().catch((e) => {
  console.error("Erreur inattendue:", e);
  process.exit(1);
});

