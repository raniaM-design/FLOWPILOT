import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import CompanyManagement from "@/components/company/company-management";

export default async function CompanyPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté"));
  }

  // Récupérer l'entreprise de l'utilisateur
  const user = await (prisma as any).user.findUnique({
    where: { id: session.userId },
    select: {
      companyId: true,
      company: {
        include: {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestion de l'entreprise</h1>
          <p className="text-slate-600 mt-2">Créez ou rejoignez une entreprise pour collaborer</p>
        </div>
        <CompanyManagement userCompany={user?.company} />
      </div>
    </div>
  );
}

