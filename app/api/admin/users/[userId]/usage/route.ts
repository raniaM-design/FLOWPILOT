import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/flowpilot-auth/admin";
import { getUserUsageStats } from "@/lib/flowpilot-auth/user-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Statistiques d'utilisation détaillées pour un utilisateur
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;

    const { userId } = await params;
    const stats = await getUserUsageStats(userId);

    if (!stats) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[admin/users/usage] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
