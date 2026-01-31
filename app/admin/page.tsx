import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import AdminDashboard from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté pour accéder à cette page"));
  }

  // Vérifier le rôle actuel dans la base
  const user = await (prisma as any).user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/?error=" + encodeURIComponent("Accès refusé. Droits administrateur requis."));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord administrateur</h1>
          <p className="text-slate-600 mt-2">Statistiques d'utilisation de l'application</p>
        </div>
        <AdminDashboard />
      </div>
    </div>
  );
}

