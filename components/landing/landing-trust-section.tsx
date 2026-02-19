import * as React from "react";
import { Shield, Sparkles, FileCheck, CheckCircle2 } from "lucide-react";

export interface TrustPillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface LandingTrustSectionProps {
  title: string;
  subtitle: string;
  tagline: string;
  pillars: TrustPillar[];
}

const defaultPillars: TrustPillar[] = [
  {
    icon: Shield,
    title: "Sécurité",
    description: "Vos données sont hébergées en Europe et protégées.",
  },
  {
    icon: Sparkles,
    title: "Simplicité",
    description: "Interface intuitive, prise en main rapide sans formation.",
  },
  {
    icon: FileCheck,
    title: "Traçabilité",
    description: "Chaque décision et action documentées, auditables.",
  },
  {
    icon: CheckCircle2,
    title: "Fiabilité",
    description: "Outil pensé pour les équipes qui avancent au quotidien.",
  },
];

export function LandingTrustSection({
  title,
  subtitle,
  tagline,
  pillars = defaultPillars,
}: LandingTrustSectionProps) {
  return (
    <section id="trust" className="container mx-auto px-6 py-20 md:py-28">
      <div className="max-w-4xl mx-auto text-center mb-16 md:mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-slate-600 mb-4 leading-relaxed font-medium">
          {subtitle}
        </p>
        <p className="text-xl md:text-2xl font-bold text-blue-600">
          {tagline}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {pillar.title}
              </h3>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
