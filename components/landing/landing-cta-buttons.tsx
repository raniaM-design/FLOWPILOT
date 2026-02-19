"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { trackLandingEvent } from "./landing-track";

export interface LandingCTAButtonsProps {
  ctaPrimary: string;
  ctaSecondary: string;
}

export function LandingCTAButtons({
  ctaPrimary,
  ctaSecondary,
}: LandingCTAButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
      <Link href="/signup">
        <Button
          size="lg"
          className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          onClick={() => trackLandingEvent("cta_primary_click", { location: "hero" })}
        >
          {ctaPrimary}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
      <Link href="/#how-it-works">
        <Button
          size="lg"
          variant="outline"
          className="px-8 py-6 text-lg font-medium border-2"
          onClick={() => trackLandingEvent("cta_demo_click", { location: "hero" })}
        >
          {ctaSecondary}
        </Button>
      </Link>
    </div>
  );
}
