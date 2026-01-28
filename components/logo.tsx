"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LOGO_OFFICIAL_DIMENSIONS, getLogoDimensions } from "@/lib/logo-config";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  variant?: "light" | "dark"; // light: logo coloré sur fond clair, dark: logo blanc sur fond sombre (menu)
}

/**
 * Composant Logo PILOTYS
 * 
 * Variantes :
 * - light (par défaut) : Logo bleu sur fond blanc/clair (landing page, header, documents)
 * - dark : Logo blanc sur fond sombre (menu sidebar)
 */
export function Logo({ 
  size = "md", 
  href,
  className,
  variant = "light",
  ...props 
}: LogoProps) {
  const sizeStyles = {
    sm: {
      height: 28,
      iconSize: 20,
    },
    md: {
      height: 40,
      iconSize: 24,
    },
    lg: {
      height: 48,
      iconSize: 28,
    },
    xl: {
      height: 56,
      iconSize: 32,
    },
  };

  const style = sizeStyles[size];
  const dimensions = getLogoDimensions(style.height);
  const iconInnerSize = style.iconSize - 8;

  // Logo avec variante dark (blanc sur fond sombre) pour le menu
  if (variant === "dark") {
    const logoContent = (
      <div className={cn("flex items-center gap-3", className)} {...props}>
        {/* Icône - carré bleu avec flèche blanche */}
        <div 
          className="rounded-xl flex items-center justify-center shadow-lg overflow-hidden relative"
          style={{ 
            width: `${style.iconSize}px`, 
            height: `${style.iconSize}px`, 
            backgroundColor: '#2563EB' // Fond bleu pour l'icône
          }}
        >
          {/* Flèche blanche - utilise un masque pour afficher la flèche en blanc */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: 'url("/branding/logo-icon.png")',
              backgroundSize: `${iconInnerSize * 2.5}px`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              WebkitMaskImage: 'url("/branding/logo-icon.png")',
              maskImage: 'url("/branding/logo-icon.png")',
              WebkitMaskSize: `${iconInnerSize * 2.5}px`,
              maskSize: `${iconInnerSize * 2.5}px`,
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              backgroundColor: '#FFFFFF', // Couleur blanche pour la flèche
            }}
          />
        </div>
        {/* Texte PILOTYS en blanc */}
        <span className={cn(
          "font-semibold tracking-tight text-white",
          size === "sm" && "text-base",
          size === "md" && "text-lg",
          size === "lg" && "text-xl",
          size === "xl" && "text-2xl"
        )}>
          PILOTYS
        </span>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-block">
          {logoContent}
        </Link>
      );
    }

    return logoContent;
  }

  // Logo avec variante light - utilise directement logo-full.png du branding
  const logoContent = (
    <div className={cn("flex items-end gap-3 h-full", className)} {...props}>
      {/* Logo complet - utilise directement l'image du branding */}
      <img
        src="/branding/logo-full.png"
        alt="PILOTYS"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          maxHeight: `${style.height}px`,
          verticalAlign: 'bottom',
          marginBottom: 0,
          paddingBottom: 0,
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
