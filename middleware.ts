import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionCookie } from "@/lib/flowpilot-auth/session";
import { addSecurityHeaders, isSuspiciousRequest, logSecurityEvent } from "@/lib/security/security-headers";
import { getRateLimitIdentifier, apiRateLimit, loginRateLimit, sensitiveRateLimit } from "@/lib/security/rate-limiter";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Vérifier les requêtes suspectes
  if (isSuspiciousRequest(request)) {
    logSecurityEvent(request, "suspicious_request");
    return new NextResponse("Forbidden", { status: 403 });
  }
  
  // Rate limiting pour les routes sensibles
  const identifier = getRateLimitIdentifier(request);
  
  // Rate limiting sur les routes de login
  if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup")) {
    const limit = loginRateLimit(identifier);
    if (!limit.allowed) {
      logSecurityEvent(request, "rate_limit", { type: "login", remaining: limit.remaining });
      return new NextResponse(
        JSON.stringify({ error: "Trop de tentatives. Veuillez réessayer plus tard." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }
  }
  
  // Rate limiting sur les routes sensibles (password reset, etc.)
  if (pathname.includes("/password-reset") || pathname.includes("/reset-password")) {
    const limit = sensitiveRateLimit(identifier);
    if (!limit.allowed) {
      logSecurityEvent(request, "rate_limit", { type: "sensitive", remaining: limit.remaining });
      return new NextResponse(
        JSON.stringify({ error: "Trop de tentatives. Veuillez réessayer plus tard." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }
  }
  
  // Rate limiting sur les routes API
  if (pathname.startsWith("/api/")) {
    const limit = apiRateLimit(identifier);
    if (!limit.allowed) {
      logSecurityEvent(request, "rate_limit", { type: "api", remaining: limit.remaining });
      return new NextResponse(
        JSON.stringify({ error: "Trop de requêtes. Veuillez ralentir." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }
  }
  
  // Fonction helper pour lire la session sans faire crasher le middleware
  async function safeReadSession() {
    try {
      const userId = await readSessionCookie(request);
      return userId ?? null;
    } catch (err) {
      console.error("[middleware] Error in readSessionCookie:", err);
      return null;
    }
  }
  
  // Routes API protégées
  if (pathname.startsWith("/api/")) {
    // Exclure les routes publiques
    const publicRoutes = ["/api/auth/", "/api/health"];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    if (!isPublicRoute) {
      const userId = await safeReadSession();
      
      if (!userId) {
        logSecurityEvent(request, "auth_failure", { type: "api_unauthorized" });
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }
    
    const response = NextResponse.next();
    return addSecurityHeaders(response, request);
  }
  
  // Routes /app protégées
  if (pathname.startsWith("/app")) {
    const userId = await safeReadSession();
    
    if (!userId) {
      logSecurityEvent(request, "auth_failure", { type: "app_unauthorized" });
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    const response = NextResponse.next();
    return addSecurityHeaders(response, request);
  }
  
  // Ajouter les headers de sécurité à toutes les autres réponses
  const response = NextResponse.next();
  return addSecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

