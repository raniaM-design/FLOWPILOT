import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebarWithRole } from "@/components/app-sidebar-with-role";
import { AppTopbar } from "@/components/app-topbar";
import { AppFooter } from "@/components/app-footer";
import { DisplayPreferencesProvider } from "@/contexts/display-preferences-context";
import { Toaster } from "@/components/ui/toaster";

// Forcer le runtime Node.js pour éviter les erreurs __dirname en Edge
export const runtime = "nodejs";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user from session (middleware already verified, but we need email for display)
  const cookieStore = await cookies();
  const token = cookieStore.get("flowpilot_session")?.value;

  // Vérifier l'authentification avant de continuer
  if (!token) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté pour accéder à cette page"));
  }

  const { verifySessionToken } = await import("@/lib/flowpilot-auth/jwt");
  const userId = await verifySessionToken(token);
  
  if (!userId) {
    // Token invalide, rediriger vers login
    redirect("/login?error=" + encodeURIComponent("Session expirée. Veuillez vous reconnecter."));
  }

  let userEmail: string | null = null;
  let userRole: string | null = null;
  let subscription: {
    plan: "trial" | "pro" | "pro_annual" | "cancelled";
    status: "active" | "cancelled" | "expired";
    currentPeriodEnd?: string | Date;
    cancelAtPeriodEnd?: boolean;
  } | undefined = undefined;

  let displayPreferences = {
    reduceAnimations: false,
    displayMode: "standard" as "standard" | "simplified",
    density: "standard" as "comfort" | "standard" | "compact",
  };

  // Récupérer les informations utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      role: true,
      createdAt: true,
      displayReduceAnimations: true,
      displayMode: true,
      displayDensity: true,
    } as any,
  }) as { email: string; role: string; createdAt: Date; displayReduceAnimations: boolean; displayMode: string | null; displayDensity: string | null } | null;
  
  if (!user) {
    // Utilisateur n'existe plus en base, rediriger vers login
    redirect("/login?error=" + encodeURIComponent("Compte introuvable. Veuillez vous reconnecter."));
  }

  userEmail = user.email ?? null;
  userRole = user.role ?? null;

  // Charger les préférences d'affichage
  displayPreferences = {
    reduceAnimations: user.displayReduceAnimations ?? false,
    displayMode: (user.displayMode as "standard" | "simplified") ?? "standard",
    density: (user.displayDensity as "comfort" | "standard" | "compact") ?? "standard",
  };

  // TODO: Récupérer les informations d'abonnement depuis Stripe/DB
  // Pour l'instant, on considère que tous les utilisateurs sont en essai gratuit
  const trialEndDate = new Date(user.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + 30);
  subscription = {
    plan: "trial",
    status: "active",
    currentPeriodEnd: trialEndDate.toISOString(), // Convertir en string pour la sérialisation
    cancelAtPeriodEnd: false,
  };

  return (
    <>
      <DisplayPreferencesProvider initialPreferences={displayPreferences}>
        <div className="flex h-screen overflow-hidden bg-background">
          <AppSidebarWithRole userRole={userRole} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppTopbar userEmail={userEmail} userRole={userRole} subscription={subscription} />
            <main className="flex-1 overflow-y-auto bg-background flex flex-col">
              <div className="container mx-auto max-w-7xl px-6 py-10 flex-1">
                {children}
              </div>
              <AppFooter />
            </main>
          </div>
        </div>
        <Toaster />
      </DisplayPreferencesProvider>
    </>
  );
}
