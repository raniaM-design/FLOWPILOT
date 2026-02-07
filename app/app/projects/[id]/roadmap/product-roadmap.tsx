"use client";

import { FlowCard } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { PageHeader } from "@/components/ui/page-header";
import { PrintButton } from "@/components/print-button";
import { ArrowLeft, Rocket, Sparkles, Code, TrendingUp } from "lucide-react";
import Link from "next/link";
import { roadmapItems, roadmapAxes, roadmapMonths, RoadmapItem, RoadmapAxis } from "./product-roadmap-data";
import { useMemo, useRef } from "react";
import { RoadmapExportCanvas } from "@/components/roadmap/roadmap-export-canvas";
import { RoadmapExportButtons } from "@/components/roadmap/roadmap-export-buttons";

interface ProductRoadmapProps {
  projectId: string;
  projectName: string;
  showStaticData?: boolean;
}

export function ProductRoadmap({ projectId, projectName, showStaticData = false }: ProductRoadmapProps) {
  // Icônes dynamiques
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Rocket,
    Sparkles,
    Code,
    TrendingUp,
  };

  // Couleurs par axe (classes Tailwind fixes)
  const axisColorMap: Record<RoadmapAxis, string> = {
    produit: "text-blue-600",
    ux: "text-purple-600",
    technique: "text-emerald-600",
    strategie: "text-orange-600",
  };

  // Grouper les items par axe (uniquement si showStaticData est true)
  const itemsByAxis = useMemo(() => {
    const grouped: Record<RoadmapAxis, RoadmapItem[]> = {
      produit: [],
      ux: [],
      technique: [],
      strategie: [],
    };

    if (showStaticData) {
      roadmapItems.forEach((item) => {
        grouped[item.axis].push(item);
      });
    }

    return grouped;
  }, [showStaticData]);

  // Calculer la position et largeur d'un item dans la timeline
  const getItemPosition = (item: RoadmapItem) => {
    const startIndex = roadmapMonths.findIndex((m) => m.id === item.startMonth);
    const endIndex = item.endMonth
      ? roadmapMonths.findIndex((m) => m.id === item.endMonth)
      : startIndex;

    if (startIndex === -1) return null;

    const span = endIndex - startIndex + 1;
    return { startIndex, span };
  };

  // Obtenir la couleur selon le type
  const getTypeColor = (type: RoadmapItem["type"], status?: RoadmapItem["status"]) => {
    if (status === "completed") {
      return "bg-emerald-100 border-emerald-300 text-emerald-900";
    }
    if (status === "in-progress") {
      return "bg-blue-100 border-blue-300 text-blue-900";
    }

    switch (type) {
      case "MVP":
        return "bg-blue-100 border-blue-300 text-blue-900";
      case "Beta":
        return "bg-purple-100 border-purple-300 text-purple-900";
      case "V1":
        return "bg-emerald-100 border-emerald-300 text-emerald-900";
      case "Critical":
        return "bg-red-100 border-red-300 text-red-900";
      case "Feature":
        return "bg-indigo-100 border-indigo-300 text-indigo-900";
      case "Improvement":
        return "bg-slate-100 border-slate-300 text-slate-900";
      default:
        return "bg-slate-100 border-slate-300 text-slate-900";
    }
  };

  // Obtenir la variante du badge selon le type
  const getBadgeVariant = (type: RoadmapItem["type"]) => {
    switch (type) {
      case "MVP":
        return "info" as const;
      case "Beta":
        return "warning" as const;
      case "V1":
        return "success" as const;
      case "Critical":
        return "danger" as const;
      default:
        return "neutral" as const;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container max-w-[1400px] mx-auto px-6 py-8">
        <div className="space-y-8">
          <PageHeader
            title="Product Roadmap"
            subtitle={`Vision et priorités de développement de ${projectName}`}
            actions={[
              {
                label: "Retour au projet",
                href: `/app/projects/${projectId}`,
                variant: "outline",
                icon: <ArrowLeft className="h-4 w-4" />,
              },
              ...(showStaticData ? [
                {
                  component: <RoadmapExportButtons projectName={projectName} />,
                },
              ] : []),
              {
                component: <PrintButton href={`/app/projects/${projectId}/roadmap/print`} />,
              },
            ]}
          />

          {/* Canvas caché pour l'export - uniquement si des données statiques sont affichées */}
          {showStaticData && (
          <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
            <RoadmapExportCanvas projectName={projectName} mode="export" />
          </div>
          )}

          {/* Timeline horizontale */}
          <FlowCard className="bg-white border-slate-200/60 shadow-sm overflow-x-auto">
            {!showStaticData ? (
              <div className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-slate-400 mb-4">
                    <Rocket className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Roadmap vide
                  </h3>
                  <p className="text-sm text-slate-600">
                    La roadmap de ce projet n'a pas encore été configurée. 
                    Créez des décisions et des actions pour commencer à construire votre roadmap.
                  </p>
                </div>
              </div>
            ) : (
            <div className="min-w-[1200px]">
              {/* En-tête avec mois */}
              <div className="sticky top-0 bg-white z-20 border-b-2 border-slate-300">
                <div className="flex">
                  {/* Colonne vide pour les labels d'axes */}
                  <div className="w-[220px] p-4 border-r-2 border-slate-300 bg-slate-50/50">
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Période
                    </div>
                  </div>

                  {/* Colonnes de mois */}
                  <div className="flex flex-1">
                    {roadmapMonths.map((month, index) => {
                      const isQuarterStart =
                        index === 0 ||
                        roadmapMonths[index - 1]?.quarter !== month.quarter;
                      return (
                        <div
                          key={month.id}
                          className="flex-1 p-4 border-r border-slate-200 last:border-r-0 relative bg-white"
                          style={{ minWidth: "160px" }}
                        >
                          {isQuarterStart && index > 0 && (
                            <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-slate-400" />
                          )}
                          <div className="text-sm font-semibold text-slate-900">
                            {month.label}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            {month.quarter} 2025
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Swimlanes (axes) */}
              {roadmapAxes.map((axis, axisIndex) => {
                const IconComponent = iconMap[axis.icon as keyof typeof iconMap];
                const axisItems = itemsByAxis[axis.id];

                return (
                  <div
                    key={axis.id}
                    className={`flex border-b border-slate-200 last:border-b-0 ${
                      axisIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    {/* Label de l'axe */}
                    <div className="w-[220px] p-4 border-r-2 border-slate-300 flex items-center gap-3 flex-shrink-0 bg-slate-50/30">
                      <div className={`w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm`}>
                        {IconComponent && (
                          <IconComponent className={`h-5 w-5 ${axisColorMap[axis.id]}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 leading-tight">
                          {axis.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {axisItems.length} item{axisItems.length > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    {/* Zone de timeline pour cet axe */}
                    <div className="flex-1 min-h-[100px] p-2 relative">
                      {/* Grille de colonnes pour les mois (guides visuels) */}
                      <div className="absolute inset-0 grid grid-cols-6">
                        {roadmapMonths.map((month, idx) => (
                          <div
                            key={month.id}
                            className={`border-r border-slate-100 ${idx === roadmapMonths.length - 1 ? "border-r-0" : ""}`}
                          />
                        ))}
                      </div>

                      {/* Items positionnés */}
                      {axisItems.map((item) => {
                        const position = getItemPosition(item);
                        if (!position) return null;

                        // Calculer la position en pourcentage
                        const leftPercent = (position.startIndex / roadmapMonths.length) * 100;
                        const widthPercent = (position.span / roadmapMonths.length) * 100;

                        return (
                          <div
                            key={item.id}
                            className={`absolute top-2 bottom-2 rounded-lg border-2 px-2.5 py-2 flex flex-col justify-center ${getTypeColor(
                              item.type,
                              item.status
                            )} shadow-sm hover:shadow-md transition-shadow z-10`}
                            style={{
                              left: `calc(${leftPercent}% + 8px)`,
                              width: `calc(${widthPercent}% - 16px)`,
                            }}
                            title={item.description}
                          >
                            <div className="flex items-start justify-between gap-1.5 mb-1">
                              <div className="text-xs font-semibold leading-tight flex-1 min-w-0">
                                {item.title}
                              </div>
                              <Chip
                                variant={getBadgeVariant(item.type)}
                                size="sm"
                                className="flex-shrink-0 text-[10px] px-1.5 py-0"
                              >
                                {item.type}
                              </Chip>
                            </div>
                            {item.status && (
                              <div className="text-[10px] text-slate-600 mt-0.5">
                                {item.status === "completed"
                                  ? "✓ Terminé"
                                  : item.status === "in-progress"
                                  ? "⟳ En cours"
                                  : "○ Planifié"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </FlowCard>

          {/* Légende - uniquement si des données statiques sont affichées */}
          {showStaticData && (
          <FlowCard className="bg-white border-slate-200/60 shadow-sm">
            <div className="p-6">
              <div className="text-base font-semibold text-slate-900 mb-4">Légende</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-blue-100 border-2 border-blue-300 shadow-sm" />
                  <div>
                    <div className="text-xs font-medium text-slate-900">MVP / Feature</div>
                    <div className="text-xs text-slate-500">Nouvelles fonctionnalités</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 border-2 border-emerald-300 shadow-sm" />
                  <div>
                    <div className="text-xs font-medium text-slate-900">V1 / Terminé</div>
                    <div className="text-xs text-slate-500">Livré et stabilisé</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-red-100 border-2 border-red-300 shadow-sm" />
                  <div>
                    <div className="text-xs font-medium text-slate-900">Critical</div>
                    <div className="text-xs text-slate-500">Priorité haute</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg bg-slate-100 border-2 border-slate-300 shadow-sm" />
                  <div>
                    <div className="text-xs font-medium text-slate-900">Improvement</div>
                    <div className="text-xs text-slate-500">Amélioration continue</div>
                  </div>
                </div>
              </div>
            </div>
          </FlowCard>
          )}
        </div>
      </div>
    </div>
  );
}

