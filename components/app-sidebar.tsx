"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, CheckSquare2, ListTodo, Calendar, CalendarDays, Users, ChevronDown, ChevronRight, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useTranslations } from "next-intl";

function AppSidebar() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Ouvrir automatiquement le menu Décisions si on est sur Actions ou Décisions
    if (pathname.startsWith("/app/decisions") || pathname.startsWith("/app/actions")) {
      return ["decisions"];
    }
    return [];
  });

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const navigation = [
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
    {
      name: t("decisions"),
      href: "/app/decisions",
      icon: CheckSquare2,
      id: "decisions",
      children: [
        {
          name: t("actions"),
          href: "/app/actions",
          icon: ListTodo,
        },
      ],
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
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-[#2B3C69]/95 backdrop-blur-sm border-r border-[#1E293B]">
      <div className="flex h-24 items-center px-6 border-b border-[#1E293B]/50">
        <Logo href="/app" size="xl" variant="dark" />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const hasChildren = "children" in item && item.children;
          const isExpanded = item.id ? expandedMenus.includes(item.id) : false;
          const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
          const hasActiveChild = hasChildren && item.children?.some((child) => pathname.startsWith(child.href));

          if (hasChildren) {
            return (
              <div key={item.name}>
                <div
                  onClick={() => item.id && toggleMenu(item.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms] ease-out cursor-pointer",
                    isActive || hasActiveChild
                      ? "bg-[#2563EB] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive || hasActiveChild ? "text-white" : "text-white/70")} />
                    <Link href={item.href} className="flex-1" onClick={(e) => e.stopPropagation()}>
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
                              ? "bg-[#2563EB]/80 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                          <child.icon className={cn("h-4 w-4 flex-shrink-0", isChildActive ? "text-white" : "text-white/60")} />
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
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms] ease-out",
                isActive
                  ? "bg-[#2563EB] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-white/70")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AppSidebar;
export { AppSidebar };
