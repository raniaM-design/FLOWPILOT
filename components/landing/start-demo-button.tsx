"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackLandingEvent } from "@/components/landing/landing-track";
import { useTranslations } from "next-intl";

type StartDemoButtonProps = {
  variant?: "primary" | "secondary" | "link";
  className?: string;
  location?: string;
  label?: string;
};

export function StartDemoButton({
  variant = "secondary",
  className,
  location = "hero",
  label,
}: StartDemoButtonProps) {
  const t = useTranslations("landing.hero");
  const text = label ?? t("ctaDemo");

  const handleClick = () => {
    trackLandingEvent("cta_demo_start", { location });
  };

  if (variant === "link") {
    return (
      <Link
        href="/api/demo/start"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 font-semibold text-indigo-600 transition-colors hover:text-indigo-800",
          className,
        )}
      >
        <Sparkles className="h-4 w-4" />
        {text} →
      </Link>
    );
  }

  if (variant === "primary") {
    return (
      <Link
        href="/api/demo/start"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700",
          className,
        )}
      >
        <Sparkles className="h-5 w-5" />
        {text}
      </Link>
    );
  }

  return (
    <Link
      href="/api/demo/start"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 transition-all hover:bg-indigo-50",
        className,
      )}
    >
      <Sparkles className="h-5 w-5" />
      {text}
    </Link>
  );
}
