import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StepRowProps {
  steps: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>;
}

export function StepRow({ steps }: StepRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={index} className="relative">
            {/* Connector line (hidden on mobile) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent -z-10" />
            )}
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white mx-auto mb-4 text-lg font-bold">
                {index + 1}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mx-auto mb-5">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                {step.title}
              </h3>
              <p className="text-base text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

