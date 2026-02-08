/**
 * Headers de sécurité pour protéger l'application
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Ajouter les headers de sécurité à une réponse
 */
export function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval pour Next.js en dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://graph.microsoft.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Headers de sécurité
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  if (isProduction) {
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  
  // Désactiver la mise en cache pour les pages sensibles
  if (request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  
  return response;
}

/**
 * Vérifier si la requête provient d'une source suspecte
 */
export function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  const path = request.nextUrl.pathname;
  
  // Exclure les routes d'authentification avec des paramètres d'erreur légitimes
  // Ces routes peuvent avoir des paramètres d'erreur encodés qui ne sont pas des attaques
  const authRoutes = ["/signup", "/login", "/auth/signup", "/auth/login"];
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));
  
  // Si c'est une route d'authentification avec seulement un paramètre "error", c'est probablement légitime
  if (isAuthRoute) {
    const searchParams = request.nextUrl.searchParams;
    const hasOnlyErrorParam = searchParams.has("error") && Array.from(searchParams.keys()).length === 1;
    if (hasOnlyErrorParam) {
      // Vérifier que le paramètre error ne contient pas de code malveillant
      const errorParam = searchParams.get("error") || "";
      // Décoder une fois pour vérifier le contenu réel
      try {
        const decoded = decodeURIComponent(errorParam);
        // Si le contenu décodé ne contient pas de patterns suspects, c'est légitime
        const hasMaliciousContent = /<script|javascript:|onerror=|onload=|<iframe|union\s+select|drop\s+table|delete\s+from/i.test(decoded);
        if (!hasMaliciousContent) {
          return false; // Route d'authentification légitime avec paramètre d'erreur
        }
      } catch {
        // Si le décodage échoue, on continue avec la vérification normale
      }
    }
  }
  
  // Détecter les user-agents suspects
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];
  
  // Exclure les bots légitimes (Google, etc.)
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
  ];
  
  const isLegitimateBot = legitimateBots.some(pattern => pattern.test(userAgent));
  const isSuspiciousBot = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  // Détecter les tentatives d'injection SQL dans les paramètres
  // Patterns plus précis pour éviter les faux positifs avec les URLs encodées légitimes
  const sqlInjectionPatterns = [
    // Pattern 1: Apostrophe suivie de OR/AND (plus spécifique)
    /(\%27|\')\s*(or|and)\s+[\d\w]/i,
    // Pattern 2: UNION SELECT (injection SQL classique)
    /union\s+select/i,
    // Pattern 3: Commentaires SQL (-- ou #) suivis de code
    /(\-\-|\%23|#)\s*[\w\d]/i,
    // Pattern 4: DROP TABLE, DELETE FROM, etc.
    /(drop\s+table|delete\s+from|truncate\s+table|alter\s+table)/i,
    // Pattern 5: EXEC, EXECUTE (injection SQL)
    /exec(ute)?\s*\(/i,
  ];
  
  const url = request.nextUrl.toString();
  // Vérifier dans l'URL décodée pour éviter les faux positifs avec l'encodage
  let urlToCheck = url;
  try {
    // Essayer de décoder l'URL une fois pour vérifier le contenu réel
    urlToCheck = decodeURIComponent(url);
  } catch {
    // Si le décodage échoue, utiliser l'URL originale
    urlToCheck = url;
  }
  
  const hasSqlInjection = sqlInjectionPatterns.some(pattern => pattern.test(urlToCheck));
  
  // Détecter les tentatives XSS
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /<iframe/i,
  ];
  
  const hasXss = xssPatterns.some(pattern => pattern.test(urlToCheck));
  
  return (isSuspiciousBot && !isLegitimateBot) || hasSqlInjection || hasXss;
}

/**
 * Logger les tentatives suspectes
 */
export function logSecurityEvent(
  request: NextRequest,
  eventType: "suspicious_request" | "rate_limit" | "csrf_failure" | "auth_failure",
  details?: Record<string, any>
) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const path = request.nextUrl.pathname;
  
  console.warn(`[SECURITY] ${eventType}`, {
    ip,
    userAgent,
    path,
    method: request.method,
    timestamp: new Date().toISOString(),
    ...details,
  });
  
  // En production, envoyer ces logs à un service de monitoring (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === "production") {
    // TODO: Intégrer avec un service de logging
  }
}

