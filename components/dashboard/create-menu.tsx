"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderKanban, CheckSquare2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Menu dropdown pour créer un projet ou une décision
 */
export function CreateMenu() {
  const t = useTranslations();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-premium-md">
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.create")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/app/projects/new" className="flex items-center gap-2 cursor-pointer">
            <FolderKanban className="h-4 w-4" />
            <span>{t("dashboard.newProject")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/decisions/new" className="flex items-center gap-2 cursor-pointer">
            <CheckSquare2 className="h-4 w-4" />
            <span>{t("dashboard.newDecision")}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

