import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/flowpilot-auth/password";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

export async function GET() {
  return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return NextResponse.redirect(
        new URL("/login?error=1", request.url),
        { status: 303 }
      );
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
      return NextResponse.redirect(
        new URL("/login?error=1", request.url),
        { status: 303 }
      );
    }

    // Vérifier que passwordHash existe
    if (!user.passwordHash) {
      return NextResponse.redirect(
        new URL("/login?error=1", request.url),
        { status: 303 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.redirect(
        new URL("/login?error=1", request.url),
        { status: 303 }
      );
    }

    const token = await signSessionToken(user.id);

    const response = NextResponse.redirect(
      new URL("/app", request.url),
      { status: 303 }
    );

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.redirect(
      new URL("/login?error=1", request.url),
      { status: 303 }
    );
  }
}
