import { SignJWT, jwtVerify } from "jose";

/**
 * Récupère la clé secrète JWT depuis les variables d'environnement
 * Retourne null si la clé est manquante en production (pour éviter les crashes)
 * En dev, utilise une clé par défaut
 */
function getJwtSecret(): Uint8Array | null {
  const envSecret = process.env.FLOWPILOT_JWT_SECRET;

  // En prod: si la clé manque, retourner null au lieu de lancer une exception
  // Cela permet au middleware de gérer gracieusement l'erreur
  if (!envSecret) {
    if (process.env.NODE_ENV === "production") {
      // Log l'erreur mais ne pas crasher le middleware
      console.error("[JWT] FLOWPILOT_JWT_SECRET is missing in production");
      return null;
    }
    // En dev: fallback pour éviter de bloquer le MVP
    const secretValue = "dev-secret-patternizer-local-only";
    return new TextEncoder().encode(secretValue);
  }

  return new TextEncoder().encode(envSecret);
}

/**
 * Sign a session token with user ID
 */
export async function signSessionToken(userId: string): Promise<string> {
  const secret = getJwtSecret();
  
  if (!secret) {
    throw new Error("FLOWPILOT_JWT_SECRET is required to sign tokens");
  }

  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return token;
}

/**
 * Verify and decode a session token
 * Returns the user ID if valid, null otherwise
 * Ne lance JAMAIS d'exception - retourne toujours null en cas d'erreur
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const secret = getJwtSecret();
    
    // Si la clé secrète est manquante, considérer le token comme invalide
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        console.error("[JWT] Cannot verify token: FLOWPILOT_JWT_SECRET is missing");
      }
      return null;
    }

    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) || null;
  } catch (error) {
    // Toutes les erreurs (token invalide, expiré, malformé, etc.) retournent null
    // Ne pas logger en production pour éviter le spam de logs
    if (process.env.NODE_ENV === "development") {
      console.debug("[JWT] Token verification failed:", error instanceof Error ? error.message : "unknown error");
    }
    return null;
  }
}

/**
 * Sign a generic JWT token with custom payload and expiration
 */
export async function sign(payload: Record<string, any>, expiration: string): Promise<string> {
  const secret = getJwtSecret();
  
  if (!secret) {
    throw new Error("FLOWPILOT_JWT_SECRET is required to sign tokens");
  }
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);
  return token;
}

/**
 * Verify and decode a generic JWT token
 */
export async function verify(token: string): Promise<Record<string, any>> {
  const secret = getJwtSecret();
  
  if (!secret) {
    throw new Error("FLOWPILOT_JWT_SECRET is required to verify tokens");
  }
  
  const { payload } = await jwtVerify(token, secret);
  return payload as Record<string, any>;
}