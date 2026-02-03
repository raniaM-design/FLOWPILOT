"use client";

import Link from "next/link";
import { Building2, Users, Calendar, Sparkles, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Badge } from "@/components/ui/badge";

interface CollaborationSectionProps {
  hasCompany: boolean;
  isCompanyAdmin?: boolean;
}

export function CollaborationSection({ hasCompany, isCompanyAdmin = false }: CollaborationSectionProps) {
  const steps = [
    {
      icon: Building2,
      title: "Créez votre entreprise",
      description: "Invitez votre équipe et définissez votre espace de travail.",
    },
    {
      icon: Calendar,
      title: "Centralisez les réunions",
      description: "Connectez Outlook et retrouvez vos réunions automatiquement.",
    },
    {
      icon: Sparkles,
      title: "Transformez en décisions & actions",
      description: "Analysez les comptes rendus pour extraire décisions et actions.",
    },
    {
      icon: BarChart3,
      title: "Pilotez l'avancement",
      description: "Suivez ce qui avance, ce qui bloque et qui est responsable.",
    },
  ];

  const benefits = [
    "Moins de flou",
    "Responsabilités claires",
    "Suivi en un coup d'œil",
  ];

  return (
    <FlowCard className="bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 border-blue-100/60">
      <FlowCardContent className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Collaborez en équipe
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Centralisez projets, réunions, décisions et actions dans un espace partagé.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1.5 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits & CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
          {/* Benefits */}
          <div className="flex flex-wrap items-center gap-2">
            {benefits.map((benefit, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-white/60 text-slate-700 border-slate-200/60 text-xs font-medium px-3 py-1"
              >
                <CheckCircle2 className="h-3 w-3 mr-1.5 text-emerald-600" />
                {benefit}
              </Badge>
            ))}
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            {hasCompany ? (
              <div className="flex flex-col sm:flex-row gap-2">
                {isCompanyAdmin && (
                  <Link href="/app/company">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-slate-50 border-slate-300"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Inviter un membre
                    </Button>
                  </Link>
                )}
                <Link href="/app/company">
                  <Button
                    size="sm"
                    className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
                  >
                    Voir mon entreprise
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/app/company">
                <Button
                  size="sm"
                  className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Configurer mon entreprise
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

