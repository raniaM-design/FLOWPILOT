"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

// Helper pour lire le cookie de langue
function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "fr";
  const cookies = document.cookie.split(";");
  const langCookie = cookies.find((c) => c.trim().startsWith("pilotys_language="));
  if (langCookie) {
    const locale = langCookie.split("=")[1]?.trim();
    if (locale && languages.some((l) => l.code === locale)) {
      return locale;
    }
  }
  return "fr"; // Default
}

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<string>("fr");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Charger la locale depuis le cookie au montage
  useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  const handleLanguageChange = async (newLocale: string) => {
    setIsOpen(false);
    
    startTransition(() => {
      // Sauvegarder la préférence dans un cookie
      document.cookie = `pilotys_language=${newLocale}; path=/; max-age=31536000`; // 1 an
      
      // Sauvegarder la préférence utilisateur en DB (si connecté)
      fetch("/api/user/preferences/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLocale }),
      }).catch(() => {
        // Ignore errors
      });

      // Recharger la page pour appliquer la nouvelle langue
      window.location.reload();
    });
  };

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              locale === lang.code && "bg-slate-100"
            )}
          >
            <span>{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {locale === lang.code && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

