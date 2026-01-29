import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/flowpilot-auth/password";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/login", url.origin));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", encodeURIComponent("Email et mot de passe requis"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Sélection minimale pour l'auth : éviter de charger preferredLanguage si la colonne n'existe pas encore
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        // preferredLanguage n'est pas nécessaire pour l'auth, on l'ignore volontairement ici
      },
    });

    if (!user) {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", encodeURIComponent("Email ou mot de passe incorrect"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Vérifier que passwordHash existe
    if (!user.passwordHash) {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", encodeURIComponent("Compte invalide. Veuillez contacter le support."));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", encodeURIComponent("Email ou mot de passe incorrect"));
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    const token = await signSessionToken(user.id);

    const response = NextResponse.redirect(
      new URL("/app", request.url),
      { status: 303 }
    );

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("[auth/login] Erreur lors de la connexion:", error);
    const errorUrl = new URL("/login", request.url);
    errorUrl.searchParams.set("error", encodeURIComponent("Une erreur s'est produite. Veuillez réessayer."));
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}
