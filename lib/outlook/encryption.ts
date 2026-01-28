import crypto from "crypto";

/**
 * Clé de chiffrement pour les tokens Microsoft
 * Utilise une variable d'environnement ou une clé par défaut (dev uniquement)
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.MICROSOFT_TOKEN_ENCRYPTION_KEY;
  
  if (envKey) {
    // La clé doit faire 32 bytes (256 bits) pour AES-256
    // Si fournie via env, on la hash pour garantir 32 bytes
    return crypto.createHash("sha256").update(envKey).digest();
  }
  
  // En dev: clé par défaut (⚠️ NE JAMAIS UTILISER EN PROD)
  if (process.env.NODE_ENV === "production") {
    throw new Error("MICROSOFT_TOKEN_ENCRYPTION_KEY must be set in production");
  }
  
  // Clé par défaut pour dev (32 bytes)
  return crypto.createHash("sha256").update("dev-microsoft-token-key-flowpilot-local-only").digest();
}

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Chiffre un token Microsoft avant stockage en DB
 * @param plaintext Token en clair
 * @returns Token chiffré (format: iv:authTag:encrypted)
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty token");
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted (tous en hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Déchiffre un token Microsoft depuis la DB
 * @param encrypted Token chiffré (format: iv:authTag:encrypted)
 * @returns Token en clair
 */
export function decryptToken(encrypted: string): string {
  if (!encrypted) {
    throw new Error("Cannot decrypt empty token");
  }
  
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

