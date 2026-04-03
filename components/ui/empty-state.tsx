import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Icône Lucide affichée dans le cercle */
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  /** URL Next.js (ex. `/app/actions?tab=blocked`) */
  ctaAction: string;
  /** Sans FlowCard : à placer dans une carte parente */
  embedded?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  embedded = false,
  className,
}: EmptyStateProps) {
  const inner = (
    <div
      className={cn(
        embedded ? "py-10 px-4 sm:px-6 text-center" : "py-12 px-6 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC]">
        <Icon className="h-7 w-7 text-[#667085]" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-semibold text-[#111111] mb-2">{title}</h3>
      <p className="text-sm text-[#667085] mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <Button
        asChild
        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium"
      >
        <Link href={ctaAction}>{ctaLabel}</Link>
      </Button>
    </div>
  );

  if (embedded) {
    return inner;
  }

  return (
    <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
      <FlowCardContent className="p-0">{inner}</FlowCardContent>
    </FlowCard>
  );
}
