import { NextResponse } from "next/server";
import { requireAdmin, getUsersForAdmin } from "@/lib/flowpilot-auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liste des utilisateurs pour l'administration
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;

    const users = await getUsersForAdmin();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[admin/users] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}
