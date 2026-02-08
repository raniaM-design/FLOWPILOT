"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, CheckSquare2, ListTodo, Calendar, CalendarDays, Users, ChevronDown, ChevronRight, Plug, Shield, Headphones, Building2, UserPlus, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useTranslations } from "next-intl";

interface AppSidebarWithRoleProps {
  userRole?: string | null;
  isCompanyAdmin?: boolean;
  hasCompany?: boolean;
}

function AppSidebarWithRole({ userRole, isCompanyAdmin = false, hasCompany = false }: AppSidebarWithRoleProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    const menus: string[] = [];
    if (pathname.startsWith("/app/company")) {
      menus.push("collaboration");
    }
    return menus;
  });

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const navigation: Array<{
    name: string;
    href: string;
    icon: any;
    id?: string;
    children?: Array<{ name: string; href: string; icon: any }>;
    dataOnboarding?: string;
    groupStart?: boolean;
    groupEnd?: boolean;
  }> = [
    {
      name: t("dashboard"),
      href: "/app",
      icon: LayoutDashboard,
    },
    {
      name: t("projects"),
      href: "/app/projects",
      icon: FolderKanban,
    },
    // Groupe Décisions et Actions avec séparateur visuel
    {
      name: t("decisions"),
      href: "/app/decisions",
      icon: CheckSquare2,
      dataOnboarding: "decisions-link",
      groupStart: true, // Marque le début d'un groupe
    },
    {
      name: t("actions"),
      href: "/app/actions",
      icon: ListTodo,
      dataOnboarding: "actions-link",
      groupEnd: true, // Marque la fin d'un groupe
    },
    {
      name: t("meetings"),
      href: "/app/meetings",
      icon: Users,
    },
    {
      name: t("review"),
      href: "/app/review",
      icon: Calendar,
      dataOnboarding: "review-link",
    },
    {
      name: t("calendar"),
      href: "/app/calendar",
      icon: CalendarDays,
    },
    {
      name: t("integrations"),
      href: "/app/integrations/outlook",
      icon: Plug,
      dataOnboarding: "integrations-link",
    },
  ];

  // Ajouter le menu "Collaboration" si l'utilisateur a une entreprise
  if (hasCompany) {
    navigation.push({
      name: "Collaboration",
      href: "/app/company",
      icon: Building2,
      id: "collaboration",
      children: [
        {
          name: "Mon entreprise",
          href: "/app/company",
          icon: Building2,
        },
        ...(isCompanyAdmin ? [
          {
            name: "Inviter par email",
            href: "/app/company?tab=invite",
            icon: Mail,
          },
          {
            name: "Ajouter un membre",
            href: "/app/company?tab=add",
            icon: UserPlus,
          },
        ] : []),
      ],
    });
  }

  // Ajouter les liens admin/support selon le rôle
  const adminLinks = [];
  if (userRole === "ADMIN") {
    adminLinks.push({
      name: "Administration",
      href: "/admin",
      icon: Shield,
    });
  }
  if (userRole === "SUPPORT" || userRole === "ADMIN") {
    adminLinks.push({
      name: "Support",
      href: "/support",
      icon: Headphones,
    });
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#2B3C69]/95 backdrop-blur-sm border-r border-[#1E293B]">
      <div className="flex h-24 items-center px-6 border-b border-[#1E293B]/50">
        <Logo href="/app" size="xl" variant="dark" />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item, index) => {
          const hasChildren = "children" in item && item.children;
          const isExpanded = item.id ? expandedMenus.includes(item.id) : false;
          const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
          const hasActiveChild = hasChildren && item.children?.some((child) => pathname.startsWith(child.href));
          const isGroupStart = "groupStart" in item && item.groupStart;
          const isGroupEnd = "groupEnd" in item && item.groupEnd;
          const prevItem = index > 0 ? navigation[index - 1] : null;
          const isAfterGroup = prevItem && "groupEnd" in prevItem && prevItem.groupEnd;

          if (hasChildren) {
            return (
              <div key={item.name}>
                <div
                  onClick={() => item.id && toggleMenu(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms] ease-out cursor-pointer",
                    isActive || hasActiveChild
                      ? "text-white bg-white/10"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive || hasActiveChild ? "text-white" : "text-white/70")} />
                    <Link 
                      href={item.href} 
                      className="flex-1" 
                      onClick={(e) => e.stopPropagation()}
                      data-onboarding={
                item.href === "/app/projects" ? "projects-link" 
                : item.href === "/app/decisions" ? "decisions-link" 
                : item.href === "/app/meetings" ? "meetings-link" 
                : item.href === "/app/calendar" ? "calendar-link" 
                : item.href === "/app/company" ? "company-link"
                : item.href === "/app/integrations/outlook" ? "integrations-link"
                : item.href === "/app/review" ? "review-link"
                : undefined
              }
                    >
                      {item.name}
                    </Link>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </div>
                {isExpanded && item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-[120ms] ease-out",
                            isChildActive
                              ? "text-white bg-white/10"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                          data-onboarding={child.href === "/app/actions" ? "actions-link" : undefined}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                          <child.icon className="h-4 w-4 flex-shrink-0 text-white/60" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.name}>
              {/* Séparateur avant le début d'un groupe */}
              {isGroupStart && index > 0 && (
                <div className="my-2 border-t border-white/10" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms] ease-out",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                  // Style spécial pour les éléments de groupe
                  isGroupStart || isGroupEnd ? "ml-1" : ""
                )}
                data-onboarding={
                  item.href === "/app/projects" ? "projects-link" 
                  : item.href === "/app/decisions" ? "decisions-link" 
                  : item.href === "/app/actions" ? "actions-link"
                  : item.href === "/app/meetings" ? "meetings-link" 
                  : item.href === "/app/calendar" ? "calendar-link" 
                  : item.href === "/app/company" ? "company-link"
                  : item.href === "/app/integrations/outlook" ? "integrations-link"
                  : item.href === "/app/review" ? "review-link"
                  : undefined
                }
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-white/70")} />
                {item.name}
              </Link>
              {/* Séparateur après la fin d'un groupe */}
              {isGroupEnd && (
                <div className="my-2 border-t border-white/10" />
              )}
            </div>
          );
        })}

        {/* Séparateur pour les liens admin/support */}
        {adminLinks.length > 0 && (
          <>
            <div className="my-4 border-t border-white/10" />
            {adminLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms] ease-out text-white/80 hover:bg-white/10 hover:text-white"
                  data-onboarding={link.href === "/app/company" ? "company-link" : undefined}
                >
                  <link.icon className="h-5 w-5 flex-shrink-0 text-white/70" />
                  {link.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}

export default AppSidebarWithRole;
export { AppSidebarWithRole };

