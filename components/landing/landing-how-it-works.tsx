import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LandingHowItWorksProps {
  steps: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
    step: number;
  }>;
  title: string;
  subtitle: string;
}

export function LandingHowItWorks({ steps, title, subtitle }: LandingHowItWorksProps) {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-16 md:py-24">
      <div className="text-center mb-16 md:mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          {subtitle}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-transparent -z-10"
                  )}
                />
              )}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1 h-full flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white mb-5 text-lg font-bold">
                  {step.step}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-5">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                  {step.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed flex-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
