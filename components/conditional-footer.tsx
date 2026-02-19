"use client";

import { usePathname } from "next/navigation";
import { AppFooter } from "@/components/app-footer";

const FULL_WIDTH_PATTERNS = [
  /^\/app\/projects\/[^/]+\/kanban(\/.*)?$/,
  /^\/app\/projects\/[^/]+\/roadmap(\/.*)?$/,
  /^\/app\/projects\/[^/]+\/gantt(\/.*)?$/,
  /^\/app\/projects\/[^/]+\/board(\/.*)?$/,
];

function isFullWidthPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return FULL_WIDTH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function ConditionalFooter() {
  const pathname = usePathname();
  if (isFullWidthPage(pathname)) return null;
  return <AppFooter />;
}
