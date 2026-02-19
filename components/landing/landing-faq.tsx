import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LandingFAQProps {
  title: string;
  subtitle?: string;
  items: FAQItem[];
}

export function LandingFAQ({ title, subtitle, items }: LandingFAQProps) {
  return (
    <section id="faq-landing" className="container mx-auto px-6 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-5 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {(items ?? []).map((item, index) => (
            <details
              key={index}
              className="group bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden [&[open]_svg]:rotate-180"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none font-semibold text-slate-900 hover:bg-slate-50/50 transition-colors">
                <span>{item?.question ?? ""}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200" />
              </summary>
              <div className="px-6 pb-5 pt-0">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {item?.answer ?? ""}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
