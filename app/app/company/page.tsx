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

  // Récupérer l'entreprise de l'utilisateur
  const user = await (prisma as any).user.findUnique({
    where: { id: session.userId },
    select: {
      companyId: true,
      isCompanyAdmin: true,
      company: {
        include: {
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

  // Vérifier que l'utilisateur est admin entreprise
  if (!user?.isCompanyAdmin) {
    redirect("/app?error=" + encodeURIComponent("Accès réservé aux administrateurs de l'entreprise"));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestion de l'entreprise</h1>
          <p className="text-slate-600 mt-2">Gérez les membres et les paramètres de votre entreprise</p>
        </div>
        <CompanyManagement userCompany={user?.company} isCompanyAdmin={user?.isCompanyAdmin ?? false} />
      </div>
    </div>
  );
}

