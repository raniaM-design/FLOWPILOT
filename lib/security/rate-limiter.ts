/**
 * Rate Limiter - Protection contre les attaques par force brute
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store en mémoire (pour Edge Runtime)
// En production, utiliser Redis ou une base de données
const store: RateLimitStore = {};

/**
 * Rate limiter simple pour protéger les routes sensibles
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute par défaut
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  // Nettoyer les entrées expirées
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }
  
  // Initialiser ou récupérer l'entrée
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }
  
  const entry = store[key];
  
  // Vérifier si la limite est dépassée
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Incrémenter le compteur
  entry.count++;
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Obtenir l'identifiant unique pour le rate limiting
 */
export function getRateLimitIdentifier(request: { headers: Headers }): string {
  // Utiliser l'IP + User-Agent pour identifier l'utilisateur
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Créer un hash simple (en production, utiliser crypto)
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Rate limiter pour les routes de login
 */
export function loginRateLimit(identifier: string) {
  return rateLimit(`login:${identifier}`, 5, 900000); // 5 tentatives par 15 minutes
}

/**
 * Rate limiter pour les routes d'API
 */
export function apiRateLimit(identifier: string) {
  return rateLimit(`api:${identifier}`, 100, 60000); // 100 requêtes par minute
}

/**
 * Rate limiter pour les routes sensibles (password reset, etc.)
 */
export function sensitiveRateLimit(identifier: string) {
  return rateLimit(`sensitive:${identifier}`, 3, 3600000); // 3 tentatives par heure
}

