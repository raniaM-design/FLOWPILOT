"use client";

import { PrintButton } from "./print-button";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface PrintActionButtonProps {
  href?: string;
  label?: string;
}

/**
 * Wrapper client pour PrintButton
 * Permet de l'utiliser comme action dans PageHeader
 * Si href n'est pas fourni, imprime directement la page actuelle
 */
export function PrintActionButton({ href, label = "Exporter PDF" }: PrintActionButtonProps) {
  // Si href est fourni, utiliser PrintButton pour ouvrir une page dédiée
  if (href) {
    return <PrintButton href={href} label={label} />;
  }

  // Sinon, imprimer directement la page actuelle
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <FileText className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
