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

  console.log("[app/layout] Vérification authentification:", {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    cookieName: "flowpilot_session",
  });

  // Vérifier l'authentification avant de continuer
  if (!token) {
    console.log("[app/layout] ❌ Pas de token trouvé, redirection vers /login");
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté pour accéder à cette page"));
  }

  const { verifySessionToken } = await import("@/lib/flowpilot-auth/jwt");
  const userId = await verifySessionToken(token);
  
  console.log("[app/layout] Vérification token:", {
    hasUserId: !!userId,
    userId: userId || "null",
  });
  
  if (!userId) {
    // Token invalide, rediriger vers login
    console.log("[app/layout] ❌ Token invalide ou expiré, redirection vers /login");
    redirect("/login?error=" + encodeURIComponent("Session expirée. Veuillez vous reconnecter."));
  }

  console.log("[app/layout] ✅ Authentification réussie, userId:", userId);

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
  let user: {
    email: string;
    role: string;
    createdAt: Date;
    displayReduceAnimations: boolean;
    displayMode: string | null;
    displayDensity: string | null;
    isCompanyAdmin: boolean;
  } | null = null;
  let isCompanyAdmin = false;
  
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        role: true,
        createdAt: true,
        displayReduceAnimations: true,
        displayMode: true,
        displayDensity: true,
        isCompanyAdmin: true,
      },
    });
    
    isCompanyAdmin = user?.isCompanyAdmin ?? false;
  } catch (dbError: any) {
    console.error("[app/layout] ❌ Erreur DB lors de la récupération de l'utilisateur:", {
      error: dbError?.message,
      code: dbError?.code,
      name: dbError?.name,
      userId,
      stack: dbError?.stack,
    });
    
    // Message d'erreur plus spécifique selon le type d'erreur
    let errorMessage = "Erreur lors de la récupération de vos informations. Veuillez réessayer.";
    if (dbError?.code === "P1001" || dbError?.message?.includes("Can't reach database")) {
      errorMessage = "La base de données n'est pas accessible. Veuillez réessayer dans quelques instants.";
    } else if (dbError?.code === "P2025") {
      errorMessage = "Compte introuvable. Veuillez vous reconnecter.";
    }
    
    redirect("/login?error=" + encodeURIComponent(errorMessage));
  }
  
  if (!user) {
    // Utilisateur n'existe plus en base, rediriger vers login
    console.log("[app/layout] ❌ Utilisateur non trouvé en base, userId:", userId);
    redirect("/login?error=" + encodeURIComponent("Compte introuvable. Veuillez vous reconnecter."));
  }
  
  console.log("[app/layout] ✅ Utilisateur trouvé:", { email: user.email, role: user.role });

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
          <AppSidebarWithRole userRole={userRole} isCompanyAdmin={isCompanyAdmin} />
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
