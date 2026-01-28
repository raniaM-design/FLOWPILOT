import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionCookie } from "@/lib/flowpilot-auth/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Petite fonction helper pour lire la session sans faire crasher le middleware
  async function safeReadSession() {
    try {
      const userId = await readSessionCookie(request);
      return userId ?? null;
    } catch (err) {
      // On log l'erreur en dev et en prod (visible dans les logs Vercel)
      console.error("[middleware] Error in readSessionCookie:", err);
      return null; // On considère que la session est invalide plutôt que de crasher
    }
  }

  // 1) Routes API protégées
  if (pathname.startsWith("/api/")) {
    if (process.env.NODE_ENV === "development" && pathname.includes("/review/monthly/")) {
      console.log(`[middleware] API route matched: ${pathname}, method: ${request.method}`);
    }

    const userId = await safeReadSession();

    if (!userId) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[middleware] Unauthorized API request: ${pathname}`);
      }

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

    if (process.env.NODE_ENV === "development" && pathname.includes("/review/monthly/")) {
      console.log(`[middleware] Authorized API request: ${pathname}, userId: ${userId}`);
    }

    return NextResponse.next();
  }

  // 2) Routes /app protégées
  if (pathname.startsWith("/app")) {
    const userId = await safeReadSession();

    if (!userId) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 3) Le reste passe
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
