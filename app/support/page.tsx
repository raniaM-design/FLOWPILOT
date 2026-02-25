import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import SupportDashboard from "@/components/support/support-dashboard";

export default async function SupportPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté pour accéder à cette page"));
  }

  // Vérifier le rôle actuel dans la base
  const user = await (prisma as any).user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || (user.role !== "SUPPORT" && user.role !== "ADMIN")) {
    redirect("/?error=" + encodeURIComponent("Accès refusé. Droits support requis."));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-900">Support utilisateurs</h1>
          <p className="text-teal-700 mt-2">Gestion et assistance aux utilisateurs</p>
        </div>
        <SupportDashboard />
      </div>
    </div>
  );
}

