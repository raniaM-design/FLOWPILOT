"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface PrintButtonProps {
  href: string;
  label?: string;
}

/**
 * Composant client pour ouvrir une page print dans un nouvel onglet
 */
export function PrintButton({ href, label = "Exporter en PDF" }: PrintButtonProps) {
  const handlePrint = () => {
    window.open(href, "_blank");
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <FileText className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

