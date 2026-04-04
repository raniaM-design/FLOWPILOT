import { X, Check } from "lucide-react";

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
    <section id="avant-apres" className="container mx-auto px-5 py-14 md:px-6 md:py-24">
      <div className="mb-10 md:mb-14">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Avant · Après
          </p>
          <span className="hidden h-px flex-1 bg-slate-200 sm:block" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-lg font-medium text-slate-600 md:text-xl">{subtitle}</p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {before.title}
          </p>
          <div className="mb-5 h-px bg-slate-100" />
          <ul className="space-y-4">
            {(before.points ?? []).map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-800">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <X className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium leading-relaxed md:text-base">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-[#2563EB] p-6 shadow-lg shadow-blue-500/20 md:p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
            {after.title}
          </p>
          <div className="mb-5 h-px bg-white/25" />
          <ul className="space-y-4">
            {(after.points ?? []).map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-white">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium leading-relaxed md:text-base">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
