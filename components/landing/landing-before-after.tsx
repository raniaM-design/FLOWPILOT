import * as React from "react";
import { AlertCircle, CheckSquare2 } from "lucide-react";

export interface LandingBeforeAfterProps {
  title: string;
  subtitle: string;
  before: {
    title: string;
    points: string[];
  };
  after: {
    title: string;
    points: string[];
  };
}

export function LandingBeforeAfter({
  title,
  subtitle,
  before,
  after,
}: LandingBeforeAfterProps) {
  return (
    <section id="avant-apres" className="container mx-auto px-6 py-20 md:py-28">
      <div className="text-center mb-16 md:mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Avant */}
        <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-8 md:p-10 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-xl md:text-2xl font-bold text-red-900 mb-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
            {before.title}
          </h3>
          <ul className="space-y-4">
            {(before.points ?? []).map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-800">
                <span className="text-red-500 mt-1 text-base font-bold flex-shrink-0">
                  ×
                </span>
                <span className="text-sm md:text-base leading-relaxed font-medium">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Après */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-8 md:p-10 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-xl md:text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-3">
            <CheckSquare2 className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
            {after.title}
          </h3>
          <ul className="space-y-4">
            {(after.points ?? []).map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-800">
                <span className="text-emerald-600 mt-1 text-base font-bold flex-shrink-0">
                  ✓
                </span>
                <span className="text-sm md:text-base leading-relaxed font-medium">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
