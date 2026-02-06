import { redirect } from "next/navigation";
import { getSession } from "@/lib/flowpilot-auth/session";
import { prisma } from "@/lib/db";
import CompanyManagement, { type CompanyManagementProps } from "@/components/company/company-management";
import { getPlanContext } from "@/lib/billing/getPlanContext";
import { TeamSpaceLocked } from "@/components/team-space/team-space-locked";
import { getCompanyPageStats } from "@/lib/company/getCompanyPageStats";
import { CompanyPageContent } from "@/components/company/company-page-content";

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
    // Essayer d'abord avec tous les champs (isCompanyAdmin et name)
    try {
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
                  name: true,
                  role: true,
                  isCompanyAdmin: true,
                  createdAt: true,
                },
                // Inclure tous les membres, y compris l'utilisateur actuel
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });
      isCompanyAdmin = user?.isCompanyAdmin ?? false;
      
      // Vérification alternative : si l'utilisateur n'a pas isCompanyAdmin mais est dans les membres avec isCompanyAdmin
      if (!isCompanyAdmin && user?.company?.members) {
        const currentUserMember = user.company.members.find((m: any) => m.id === session.userId);
        if (currentUserMember?.isCompanyAdmin) {
          isCompanyAdmin = true;
        }
      }
    } catch (fieldError: any) {
      // Si l'erreur est liée à un champ manquant (isCompanyAdmin ou name), réessayer sans
      if (fieldError?.message?.includes("isCompanyAdmin") || 
          fieldError?.message?.includes("name") || 
          fieldError?.code === "P2021" || 
          fieldError?.code === "P2009") {
        console.warn("[company/page] Certains champs n'existent pas encore, réessai sans ces champs");
        try {
          // Essayer sans isCompanyAdmin mais avec name
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
                      name: true,
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
          isCompanyAdmin = false;
        } catch (retryError: any) {
          // Si ça échoue encore, essayer sans le champ name dans members
          if (retryError?.message?.includes("name") || retryError?.code === "P2009") {
            console.warn("[company/page] Le champ name n'existe pas encore dans members, réessai sans");
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
            isCompanyAdmin = false;
          } else {
            throw retryError;
          }
        }
      } else {
        throw fieldError;
      }
    }
  } catch (error: any) {
    console.error("[company/page] Erreur lors de la récupération de l'utilisateur:", error);
    // Ne pas rediriger, permettre l'affichage de la page même en cas d'erreur
    // L'utilisateur pourra toujours créer/rejoindre une entreprise
    user = null;
    isCompanyAdmin = false;
  }

  // Si l'utilisateur n'a pas d'entreprise, permettre quand même l'accès
  // Le composant CompanyManagement gérera l'affichage du formulaire de création/rejoindre
  // Si l'utilisateur a une entreprise mais n'est pas admin, il peut voir les membres mais pas les gérer

  // Récupérer les stats pour la page améliorée
  let stats = null;
  try {
    stats = await getCompanyPageStats(session.userId);
  } catch (error) {
    console.error("[company/page] Erreur lors de la récupération des stats:", error);
  }

  // Si l'utilisateur a une entreprise, afficher la vue améliorée
  if (user?.company) {
    // Vérifier si l'utilisateur actuel est admin en cherchant dans les membres
    // ou en vérifiant directement depuis la base de données si nécessaire
    if (!isCompanyAdmin) {
      if (user.company.members && user.company.members.length > 0) {
        const currentUserMember = user.company.members.find((m: any) => m.id === session.userId);
        if (currentUserMember?.isCompanyAdmin) {
          isCompanyAdmin = true;
          console.log("[company/page] ✅ Utilisateur trouvé comme admin dans les membres");
        } else {
          console.log("[company/page] ⚠️ Utilisateur trouvé dans les membres mais isCompanyAdmin =", currentUserMember?.isCompanyAdmin);
        }
      }
      
      // Si toujours pas admin, vérifier directement dans la base de données
      if (!isCompanyAdmin) {
        try {
          const currentUser = await (prisma as any).user.findUnique({
            where: { id: session.userId },
            select: { isCompanyAdmin: true },
          });
          if (currentUser?.isCompanyAdmin) {
            isCompanyAdmin = true;
            console.log("[company/page] ✅ Utilisateur trouvé comme admin dans la base de données");
          } else {
            console.log("[company/page] ⚠️ isCompanyAdmin dans la base =", currentUser?.isCompanyAdmin);
          }
        } catch (err) {
          console.warn("[company/page] Erreur lors de la vérification isCompanyAdmin:", err);
        }
      }
    } else {
      console.log("[company/page] ✅ isCompanyAdmin déjà défini à true");
    }
    
    console.log("[company/page] 🔍 État final - isCompanyAdmin:", isCompanyAdmin, "userId:", session.userId);
    
    // Calculer s'il y a un admin dans l'entreprise (côté serveur pour sécurité)
    // Vérifier d'abord dans les membres chargés, puis en base de données
    let hasAnyAdmin = false;
    
    // Log des membres pour déboguer
    if (user.company.members && user.company.members.length > 0) {
      console.log("[company/page] 🔍 Membres chargés:", JSON.stringify(user.company.members.map((m: any) => ({
        id: m.id,
        email: m.email,
        isCompanyAdmin: m.isCompanyAdmin,
        role: m.role,
      })), null, 2));
      
      // Vérifier dans les membres chargés
      hasAnyAdmin = user.company.members.some((m: any) => {
        const isAdmin = m.isCompanyAdmin === true;
        console.log("[company/page] 🔍 Membre:", m.email, "isCompanyAdmin:", m.isCompanyAdmin, "type:", typeof m.isCompanyAdmin, "isAdmin:", isAdmin);
        return isAdmin;
      });
      console.log("[company/page] 🔍 hasAnyAdmin depuis membres chargés:", hasAnyAdmin);
    }
    
    // Vérification directe en base de données (source de vérité absolue)
    try {
      const adminCount = await (prisma as any).user.count({
        where: {
          companyId: user.companyId,
          isCompanyAdmin: true,
        },
      });
      const hasAdminInDb = adminCount > 0;
      console.log("[company/page] 🔍 Vérification directe en base - adminCount:", adminCount, "hasAdminInDb:", hasAdminInDb, "companyId:", user.companyId);
      
      // Utiliser la valeur de la base de données comme source de vérité
      if (hasAdminInDb !== hasAnyAdmin) {
        console.warn("[company/page] ⚠️ Incohérence détectée: membres chargés dit", hasAnyAdmin, "mais base de données dit", hasAdminInDb);
      }
      hasAnyAdmin = hasAdminInDb; // La base de données est la source de vérité
    } catch (err: any) {
      console.error("[company/page] ❌ Erreur lors de la vérification directe des admins:", err);
      console.error("[company/page] ❌ Stack:", err.stack);
      // En cas d'erreur, utiliser la valeur calculée depuis les membres
      console.log("[company/page] 🔍 Utilisation du fallback depuis membres chargés");
    }
    
    console.log("[company/page] 🔍 hasAnyAdmin FINAL:", hasAnyAdmin);
    
    // Si stats est disponible, utiliser la vue améliorée
    if (stats) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Collaboration / Entreprise</h1>
              <p className="text-slate-600 mt-2">
                {isCompanyAdmin 
                  ? "Gérez les membres et les paramètres de votre entreprise"
                  : "Consultez les informations de votre entreprise"}
              </p>
            </div>
            <CompanyPageContent 
              company={user.company} 
              stats={stats} 
              isCompanyAdmin={isCompanyAdmin}
              hasAnyAdmin={hasAnyAdmin}
            />
          </div>
        </div>
      );
    }
    // Sinon, utiliser la vue de base avec CompanyManagement
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Collaboration / Entreprise</h1>
            <p className="text-slate-600 mt-2">
              {isCompanyAdmin 
                ? "Gérez les membres et les paramètres de votre entreprise"
                : "Consultez les informations de votre entreprise"}
            </p>
          </div>
          <CompanyManagement userCompany={user.company} isCompanyAdmin={isCompanyAdmin} hasAnyAdmin={hasAnyAdmin} />
        </div>
      </div>
    );
  }

  // Sinon, afficher le formulaire de création/rejoindre (comportement existant)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Collaboration / Entreprise</h1>
          <p className="text-slate-600 mt-2">
            Créez ou rejoignez une entreprise pour collaborer avec votre équipe
          </p>
        </div>
        <CompanyManagement userCompany={user?.company || null} isCompanyAdmin={isCompanyAdmin} hasAnyAdmin={user?.company ? hasAnyAdmin : false} />
      </div>
    </div>
  );
}

