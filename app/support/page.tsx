import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { isSupport } from "@/lib/flowpilot-auth/support";
import SupportDashboard from "@/components/support/support-dashboard";

export default async function SupportPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté pour accéder à cette page"));
  }

  const userIsSupport = await isSupport(session.userId);

  if (!userIsSupport) {
    redirect("/?error=" + encodeURIComponent("Accès refusé. Droits support requis."));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Support utilisateurs</h1>
          <p className="text-slate-600 mt-2">Gestion et assistance aux utilisateurs</p>
        </div>
        <SupportDashboard />
      </div>
    </div>
  );
}

