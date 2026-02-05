"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebarWithRole } from "@/components/app-sidebar-with-role";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MobileSidebarProps {
  userRole?: string | null;
  isCompanyAdmin?: boolean;
  hasCompany?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  userRole,
  isCompanyAdmin,
  hasCompany,
  open,
  onOpenChange,
}: MobileSidebarProps) {
  const pathname = usePathname();

  // Fermer le drawer quand on change de page
  useEffect(() => {
    if (open) {
      onOpenChange(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="h-full">
          <AppSidebarWithRole
            userRole={userRole}
            isCompanyAdmin={isCompanyAdmin}
            hasCompany={hasCompany}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

