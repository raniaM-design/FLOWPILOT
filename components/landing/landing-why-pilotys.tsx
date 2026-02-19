import * as React from "react";
import {
  FileCheck,
  Zap,
  LayoutDashboard,
  AlertCircle,
  FileDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LandingWhyPilotysProps {
  title: string;
  subtitle: string;
  tagline: string;
  points: string[];
}

const ICONS: LucideIcon[] = [
  FileCheck,
  Zap,
  LayoutDashboard,
  AlertCircle,
  FileDown,
];

const CARD_STYLES = [
  "from-blue-50 to-indigo-50 border-blue-200/40 text-blue-700",
  "from-violet-50 to-purple-50 border-violet-200/40 text-violet-700",
  "from-emerald-50 to-teal-50 border-emerald-200/40 text-emerald-700",
  "from-amber-50 to-orange-50 border-amber-200/40 text-amber-700",
  "from-slate-50 to-slate-100 border-slate-200/40 text-slate-700",
] as const;

const ICON_COLORS = [
  "bg-blue-500/10 text-blue-600",
  "bg-violet-500/10 text-violet-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
  "bg-slate-500/10 text-slate-600",
] as const;

export function LandingWhyPilotys({
  title,
  subtitle,
  tagline,
  points,
}: LandingWhyPilotysProps) {
  const items = (points ?? []).slice(0, 5);

  return (
    <section id="why-pilotys" className="container mx-auto px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Bento-style grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {items.map((point, index) => {
            const Icon = ICONS[index] ?? FileCheck;
            const cardStyle = CARD_STYLES[index] ?? CARD_STYLES[0];
            const iconStyle = ICON_COLORS[index] ?? ICON_COLORS[0];

            return (
              <div
                key={index}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 md:p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300/60",
                  cardStyle
                )}
              >
                <div
                  className={cn(
                    "mb-4 flex h-11 w-11 items-center justify-center rounded-xl",
                    iconStyle
                  )}
                >
                  <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2} />
                </div>
                <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium">
                  {point}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
