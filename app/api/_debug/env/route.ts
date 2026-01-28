import { NextResponse } from "next/server";

// Forcer le runtime Node.js pour accéder aux variables d'environnement
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route de debug pour vérifier que les variables d'environnement sont bien chargées
 * Accessible uniquement en développement
 */
export async function GET() {
  // Sécurité : uniquement en développement
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const keys = [
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID",
    "MICROSOFT_REDIRECT_URI",
    "MICROSOFT_SCOPES",
  ];

  // Créer un objet avec la présence de chaque variable (sans exposer les valeurs)
  const env = Object.fromEntries(
    keys.map((k) => [k, Boolean(process.env[k])])
  );

  // Obtenir les valeurs (masquées pour la sécurité)
  const values = Object.fromEntries(
    keys.map((k) => {
      const value = process.env[k];
      if (!value) return [k, null];
      // Masquer les valeurs sensibles (garder seulement les 4 premiers caractères)
      if (k.includes("SECRET")) {
        return [k, value.substring(0, 4) + "..." + (value.length > 4 ? ` (${value.length} chars)` : "")];
      }
      // Pour les autres, montrer le début seulement
      return [k, value.substring(0, 20) + (value.length > 20 ? "..." : "")];
    })
  );

  // Vérifier si .env.local existe (nécessite fs, donc Node.js uniquement)
  let envLocalExists = false;
  let envLocalPath = "";
  try {
    const fs = require("fs");
    const path = require("path");
    const envLocalFile = path.join(process.cwd(), ".env.local");
    envLocalExists = fs.existsSync(envLocalFile);
    if (envLocalExists) {
      envLocalPath = envLocalFile;
    }
  } catch {
    // Ignorer si fs n'est pas disponible
  }

  return NextResponse.json({
    ok: true,
    env,
    values,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    envLocalExists,
    envLocalPath,
    // Instructions pour l'utilisateur
    instructions: {
      checkLocation: "Vérifiez que .env.local est dans le même dossier que package.json",
      checkFormat: "Vérifiez qu'il n'y a pas d'espaces autour du signe =",
      restartServer: "Redémarrez le serveur après modification de .env.local",
    },
  });
}

