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

  const navItemClass = (active: boolean) =>
    cn(
      "relative flex min-h-16 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] transition-transform duration-150 ease-out will-change-transform active:scale-95",
      active ? "font-bold text-[#3B5BDB]" : "font-medium text-[#667085]",
    );

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#E5E7EB] bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_24px_-4px_rgba(15,23,42,0.08),0_-1px_0_rgba(15,23,42,0.04)] md:hidden"
        aria-label="Navigation principale"
      >
        <div className="relative mx-auto flex h-16 max-w-lg items-stretch justify-between px-1">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            const count = badges[tab.id];
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={navItemClass(active)}
              >
                <span className="relative inline-flex">
                  <Icon
                    className={cn("h-6 w-6", active && "text-[#3B5BDB]")}
                    strokeWidth={active ? 2.25 : 2}
                  />
                  {count > 0 ? (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B5BDB] px-1 text-[10px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-[4.5rem] truncate">{tab.label}</span>
              </Link>
            );
          })}

          <div className="relative flex h-full w-14 shrink-0 items-end justify-center">
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border-0 bg-[#3B5BDB] p-0 text-white shadow-[0_8px_24px_rgba(59,91,219,0.42),0_4px_10px_rgba(15,23,42,0.18)] transition-transform duration-150 ease-out hover:bg-[#324FC7] active:scale-95"
              aria-label={tApp("createSheet.open")}
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </Button>
          </div>

          {tabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            const count = badges[tab.id];
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={navItemClass(active)}
              >
                <span className="relative inline-flex">
                  <Icon
                    className={cn("h-6 w-6", active && "text-[#3B5BDB]")}
                    strokeWidth={active ? 2.25 : 2}
                  />
                  {count > 0 ? (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B5BDB] px-1 text-[10px] font-bold text-white">
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
        <SheetContent
          side="bottom"
          hideCloseButton
          overlayClassName="z-[105] bg-[rgba(0,0,0,0.5)] data-[state=open]:duration-300 data-[state=closed]:duration-300 data-[state=open]:ease-out data-[state=closed]:ease-out"
          className={cn(
            "z-[106] gap-0 rounded-t-2xl border-t border-[#E5E7EB] pb-[max(2rem,env(safe-area-inset-bottom))] pl-4 pr-4 pt-0",
            "shadow-[0_-8px_32px_-6px_rgba(15,23,42,0.14)]",
            "ease-out data-[state=open]:duration-300 data-[state=closed]:duration-300 data-[state=open]:ease-out data-[state=closed]:ease-out",
          )}
        >
          <div
            className="flex flex-col items-center pb-2 pt-3"
            aria-hidden
          >
            <span className="h-1 w-10 shrink-0 rounded-full bg-slate-300/90" />
          </div>
          <SheetHeader className="mb-3 space-y-0 px-0 text-left">
            <SheetTitle className="text-lg font-semibold text-[#111111]">
              {tApp("createSheet.title")}
            </SheetTitle>
          </SheetHeader>
          <ul className="flex flex-col gap-2">
            {createLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setCreateOpen(false)}
                    className="flex min-h-[72px] items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[17px] font-medium leading-snug text-[#111111] transition-colors active:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF4FF] text-[#2563EB]">
                      <Icon className="h-5 w-5" strokeWidth={2} />
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
