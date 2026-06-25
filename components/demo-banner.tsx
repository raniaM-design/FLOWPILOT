"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function DemoBanner() {
  const t = useTranslations("demo");

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 px-4 py-2 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <strong>{t("bannerTitle")}</strong>
            <span className="hidden sm:inline"> — {t("bannerSubtitle")}</span>
          </span>
        </div>
        <form method="POST" action="/api/demo/exit" className="shrink-0">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            {t("exit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
