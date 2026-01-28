import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Route Handler pour sauvegarder les préférences utilisateur
 * POST /app/preferences/actions
 * Body: { focusMode: boolean, reduceMotion: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { focusMode, reduceMotion } = body;

    // Validation
    if (typeof focusMode !== "boolean" || typeof reduceMotion !== "boolean") {
      return NextResponse.json(
        { error: "focusMode et reduceMotion doivent être des booléens" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Définir les cookies individuels (non httpOnly, accessibles côté client)
    // Cookie valide 1 an (365 jours)
    const maxAge = 60 * 60 * 24 * 365; // 1 an en secondes

    cookieStore.set("flowpilot_focusMode", String(focusMode), {
      path: "/",
      maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    cookieStore.set("flowpilot_reduceMotion", String(reduceMotion), {
      path: "/",
      maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des préférences" },
      { status: 500 }
    );
  }
}

