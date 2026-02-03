import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebarWithRole } from "@/components/app-sidebar-with-role";
import { AppTopbar } from "@/components/app-topbar";
import { AppFooter } from "@/components/app-footer";
import { DisplayPreferencesProvider } from "@/contexts/display-preferences-context";
import { Toaster } from "@/components/ui/toaster";
import { getTranslations } from "@/i18n/request";

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

  // Obtenir les traductions pour les messages d'erreur
  const t = await getTranslations("common");
  
  // Vérifier l'authentification avant de continuer
  if (!token) {
    console.log("[app/layout] ❌ Pas de token trouvé, redirection vers /login");
    redirect("/login?error=" + encodeURIComponent(t("mustBeLoggedIn")));
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
    redirect("/login?error=" + encodeURIComponent(t("sessionExpired")));
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
    // Essayer d'abord avec isCompanyAdmin
    let userData;
    try {
      userData = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          role: true,
          createdAt: true,
          displayReduceAnimations: true,
          displayMode: true,
          displayDensity: true,
          isCompanyAdmin: true,
          companyId: true,
        } as {
          email: boolean;
          role: boolean;
          createdAt: boolean;
          displayReduceAnimations: boolean;
          displayMode: boolean;
          displayDensity: boolean;
          isCompanyAdmin: boolean;
          companyId: boolean;
        },
      });
    } catch (fieldError: any) {
      // Si le champ isCompanyAdmin n'existe pas encore dans la base de données, réessayer sans
      if (fieldError?.message?.includes("isCompanyAdmin") || fieldError?.code === "P2009") {
        console.warn("[app/layout] ⚠️ Champ isCompanyAdmin non disponible, récupération sans ce champ");
        userData = await prisma.user.findUnique({
          where: { id: userId },
        select: {
          email: true,
          role: true,
          createdAt: true,
          displayReduceAnimations: true,
          displayMode: true,
          displayDensity: true,
          companyId: true,
        },
        });
        // Définir isCompanyAdmin à false par défaut si le champ n'existe pas
        isCompanyAdmin = false;
      } else {
        throw fieldError;
      }
    }
    
    user = userData as {
      email: string;
      role: string;
      createdAt: Date;
      displayReduceAnimations: boolean;
      displayMode: string | null;
      displayDensity: string | null;
      isCompanyAdmin: boolean;
      companyId: string | null;
    } | null;
    
    // Si userData contient isCompanyAdmin, l'utiliser, sinon utiliser false
    if (userData && 'isCompanyAdmin' in userData) {
      isCompanyAdmin = (userData as any).isCompanyAdmin ?? false;
    }
  } catch (dbError: any) {
    console.error("[app/layout] ❌ Erreur DB lors de la récupération de l'utilisateur:", {
      error: dbError?.message,
      code: dbError?.code,
      name: dbError?.name,
      userId,
      stack: dbError?.stack,
    });
    
    // Message d'erreur plus spécifique selon le type d'erreur
    let errorMessage = t("errorFetchingInfo");
    if (dbError?.code === "P1001" || dbError?.message?.includes("Can't reach database")) {
      errorMessage = t("databaseUnavailable");
    } else if (dbError?.code === "P2025") {
      errorMessage = t("accountNotFound");
    }
    
    redirect("/login?error=" + encodeURIComponent(errorMessage));
  }
  
  if (!user) {
    // Utilisateur n'existe plus en base, rediriger vers login
    console.log("[app/layout] ❌ Utilisateur non trouvé en base, userId:", userId);
    redirect("/login?error=" + encodeURIComponent(t("accountNotFound")));
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
          <AppSidebarWithRole 
            userRole={userRole} 
            isCompanyAdmin={isCompanyAdmin}
            hasCompany={!!user.companyId}
          />
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
