import * as React from "react";
import {
  CheckSquare2,
  MessageSquareWarning,
  Users,
  AlertCircle,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LandingDemoPreviewProps {
  title: string;
  subtitle: string;
  stats?: Array<{
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }>;
}

const defaultStats = [
  {
    label: "Actions ouvertes",
    value: "12",
    icon: <CheckSquare2 className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Décisions",
    value: "8",
    icon: <MessageSquareWarning className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-600",
  },
  {
    label: "Réunions",
    value: "5",
    icon: <Users className="h-5 w-5" />,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    label: "Points bloquants",
    value: "2",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "bg-amber-100 text-amber-600",
  },
];

export function LandingDemoPreview({
  title,
  subtitle,
  stats = defaultStats,
}: LandingDemoPreviewProps) {
  return (
    <section id="demo" className="container mx-auto px-6 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
            {subtitle}
          </p>
        </div>

        {/* Fake UI Preview - screenshot-like */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/60 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 text-sm md:text-base">
                PILOTYS — Vue d&apos;ensemble
              </span>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
            </div>
          </div>
          <div className="p-6 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border border-slate-200/80 bg-white p-4 md:p-6 shadow-sm transition-all hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 md:mb-4",
                      stat.color
                    )}
                  >
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-slate-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 md:mt-8 h-24 md:h-32 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
              <p className="text-sm text-slate-400 font-medium">
                Actions de la semaine • Dernière réunion • Points bloquants
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
