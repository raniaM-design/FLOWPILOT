"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { AppTopbar } from "@/components/app-topbar";

const HIDE_TOPBAR = /^\/app\/standup$/;

interface Props {
  userEmail?: string | null;
  userName?: string | null;
  userAvatarUrl?: string | null;
  userRole?: string | null;
  subscription?: ComponentProps<typeof AppTopbar>["subscription"];
  isCompanyAdmin?: boolean;
  hasCompany?: boolean;
}

export function ConditionalAppTopbar(props: Props) {
  const pathname = usePathname();
  if (pathname && HIDE_TOPBAR.test(pathname)) {
    return null;
  }
  return <AppTopbar {...props} />;
}
