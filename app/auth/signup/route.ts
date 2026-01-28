import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/flowpilot-auth/password";
import { signSessionToken } from "@/lib/flowpilot-auth/jwt";
import { setSessionCookie } from "@/lib/flowpilot-auth/session";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    // Validation
    if (!email || !password) {
      const errorUrl = new URL("/signup", request.url);
      errorUrl.searchParams.set("error", "Email et mot de passe requis");
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    if (password.length < 8) {
      const errorUrl = new URL("/signup", request.url);
      errorUrl.searchParams.set("error", "Le mot de passe doit contenir au moins 8 caractères");
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Check if user exists (sélection minimale pour éviter les erreurs si preferredLanguage n'existe pas)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        // On ignore preferredLanguage pour cette vérification
      },
    });

    if (existingUser) {
      const errorUrl = new URL("/signup", request.url);
      errorUrl.searchParams.set("error", "Cet email est déjà utilisé");
      return NextResponse.redirect(errorUrl, { status: 303 });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Create session
    const token = await signSessionToken(user.id);
    const response = NextResponse.redirect(new URL("/app", request.url), { status: 303 });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    const errorUrl = new URL("/signup", request.url);
    errorUrl.searchParams.set("error", "Une erreur est survenue");
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

