import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import CompanyManagement, { type CompanyManagementProps } from "@/components/company/company-management";
import { getPlanContext } from "@/lib/billing/getPlanContext";
import { TeamSpaceLocked } from "@/components/team-space/team-space-locked";

export default async function CompanyPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté"));
  }

  // Vérifier le plan Enterprise
  const { isEnterprise } = await getPlanContext();

  // Si pas Enterprise, afficher la page verrouillée
  if (!isEnterprise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <TeamSpaceLocked />
        </div>
      </div>
    );
  }

  // Récupérer l'entreprise de l'utilisateur avec gestion d'erreur robuste
  let user: any = null;
  let isCompanyAdmin = false;
  
  try {
    // Essayer d'abord avec isCompanyAdmin (si la colonne existe)
    user = await (prisma as any).user.findUnique({
      where: { id: session.userId },
      select: {
        companyId: true,
        isCompanyAdmin: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            createdAt: true,
            members: {
              select: {
                id: true,
                email: true,
                role: true,
                isCompanyAdmin: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });
    isCompanyAdmin = user?.isCompanyAdmin ?? false;
  } catch (error: any) {
    // Si l'erreur est liée à isCompanyAdmin, réessayer sans ce champ
    if (error?.message?.includes("isCompanyAdmin") || error?.code === "P2021") {
      console.warn("[company/page] isCompanyAdmin n'existe pas encore, réessai sans ce champ");
      try {
        user = await (prisma as any).user.findUnique({
          where: { id: session.userId },
          select: {
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                domain: true,
                createdAt: true,
                members: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        });
        // Par défaut, considérer comme non-admin si le champ n'existe pas
        isCompanyAdmin = false;
      } catch (retryError) {
        console.error("[company/page] Erreur lors de la récupération de l'utilisateur:", retryError);
        redirect("/app?error=" + encodeURIComponent("Erreur lors de la récupération de vos informations"));
      }
    } else {
      console.error("[company/page] Erreur lors de la récupération de l'utilisateur:", error);
      redirect("/app?error=" + encodeURIComponent("Erreur lors de la récupération de vos informations"));
    }
  }

  // Si l'utilisateur n'a pas d'entreprise, permettre quand même l'accès
  // Le composant CompanyManagement gérera l'affichage du formulaire de création/rejoindre
  // Si l'utilisateur a une entreprise mais n'est pas admin, il peut voir les membres mais pas les gérer

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Collaboration / Entreprise</h1>
          <p className="text-slate-600 mt-2">
            {isCompanyAdmin 
              ? "Gérez les membres et les paramètres de votre entreprise"
              : user?.company 
                ? "Consultez les informations de votre entreprise"
                : "Créez ou rejoignez une entreprise pour collaborer avec votre équipe"}
          </p>
        </div>
        <CompanyManagement userCompany={user?.company || null} isCompanyAdmin={isCompanyAdmin} />
      </div>
    </div>
  );
}

