"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Folder,
  Users,
  CheckSquare,
  Plus,
  FileText,
  Target,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type TabId = "dashboard" | "projects" | "meetings" | "actions";

function tabFromTargetUrl(url: string | null): TabId | null {
  if (!url) return "dashboard";
  if (url.includes("/app/actions")) return "actions";
  if (url.includes("/app/meetings")) return "meetings";
  if (url.includes("/app/projects")) return "projects";
  if (url.includes("/app/decisions") || url.startsWith("/app") || url === "/app") return "dashboard";
  return "dashboard";
}

export function AppMobileTabBar() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const tApp = useTranslations("appMobile");
  const [createOpen, setCreateOpen] = useState(false);
  const [badges, setBadges] = useState<Record<TabId, number>>({
    dashboard: 0,
    projects: 0,
    meetings: 0,
    actions: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications?limit=80&filter=unread");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const list = (data.notifications || []) as Array<{ isRead: boolean; targetUrl: string | null }>;
        const next: Record<TabId, number> = {
          dashboard: 0,
          projects: 0,
          meetings: 0,
          actions: 0,
        };
        for (const n of list) {
          if (n.isRead) continue;
          const tab = tabFromTargetUrl(n.targetUrl);
          if (tab) next[tab] += 1;
        }
        if (!cancelled) setBadges(next);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const tabs = useMemo(
    () =>
      [
        { id: "dashboard" as const, href: "/app", icon: Home, label: t("dashboard") },
        { id: "projects" as const, href: "/app/projects", icon: Folder, label: t("projects") },
        { id: "meetings" as const, href: "/app/meetings", icon: Users, label: t("meetings") },
        { id: "actions" as const, href: "/app/actions", icon: CheckSquare, label: t("actions") },
      ] satisfies Array<{ id: TabId; href: string; icon: typeof Home; label: string }>,
    [t],
  );

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const createLinks = [
    { href: "/app/meetings/new", label: tApp("createSheet.meetingNotes"), icon: FileText },
    { href: "/app/actions/new", label: tApp("createSheet.action"), icon: CheckSquare },
    { href: "/app/decisions/new", label: tApp("createSheet.decision"), icon: Target },
    { href: "/app/projects/new", label: tApp("createSheet.project"), icon: FolderPlus },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#E5E7EB] bg-white pb-[env(safe-area-inset-bottom,0px)] md:hidden"
        aria-label="Navigation principale"
      >
        <div className="relative mx-auto flex h-[64px] max-w-lg items-end justify-between px-1 pt-1">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            const count = badges[tab.id];
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 pb-2 text-[10px] font-medium",
                  active ? "text-[#2563EB]" : "text-[#667085]",
                )}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 2} />
                  {count > 0 ? (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </Link>
            );
          })}

          <div className="relative flex w-16 shrink-0 flex-col items-center justify-start">
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] p-0 text-white shadow-lg shadow-blue-500/30 hover:bg-[#1d4ed8]"
              aria-label={tApp("createSheet.open")}
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </Button>
            <span className="invisible pb-2 text-[10px]">+</span>
          </div>

          {tabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            const count = badges[tab.id];
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 pb-2 text-[10px] font-medium",
                  active ? "text-[#2563EB]" : "text-[#667085]",
                )}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 2} />
                  {count > 0 ? (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>{tApp("createSheet.title")}</SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col gap-2">
            {createLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setCreateOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm font-medium text-[#111111] transition-colors active:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF4FF] text-[#2563EB]">
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
