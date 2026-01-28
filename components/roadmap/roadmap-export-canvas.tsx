"use client";

import { FlowCard } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { Rocket, Sparkles, Code, TrendingUp } from "lucide-react";
import { roadmapItems, roadmapAxes, roadmapMonths, RoadmapItem, RoadmapAxis } from "@/app/app/projects/[id]/roadmap/product-roadmap-data";
import { useMemo } from "react";

interface RoadmapExportCanvasProps {
  projectName: string;
  mode?: "screen" | "export";
}

export function RoadmapExportCanvas({ projectName, mode = "screen" }: RoadmapExportCanvasProps) {
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

  // Grouper les items par axe
  const itemsByAxis = useMemo(() => {
    const grouped: Record<RoadmapAxis, RoadmapItem[]> = {
      produit: [],
      ux: [],
      technique: [],
      strategie: [],
    };

    roadmapItems.forEach((item) => {
      grouped[item.axis].push(item);
    });

    return grouped;
  }, []);

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

  const isExportMode = mode === "export";

  return (
    <div
      id="roadmap-export-canvas"
      className={`bg-white ${isExportMode ? "p-8" : ""}`}
      style={isExportMode ? { width: "1920px", minHeight: "1080px" } : {}}
    >
      {/* Header */}
      <div className={`mb-6 ${isExportMode ? "mb-8" : ""}`}>
        <h1 className={`${isExportMode ? "text-4xl" : "text-3xl"} font-semibold tracking-tight text-slate-900 mb-2`}>
          Product Roadmap
        </h1>
        <p className={`${isExportMode ? "text-lg" : "text-base"} text-slate-600`}>
          Vision et priorités de développement de {projectName}
        </p>
        <div className={`mt-2 text-sm text-slate-500 ${isExportMode ? "text-base" : ""}`}>
          Période : {roadmapMonths[0]?.quarter} - {roadmapMonths[roadmapMonths.length - 1]?.quarter} 2025
        </div>
      </div>

      {/* Timeline horizontale */}
      <div className={`${isExportMode ? "border-2 border-slate-300 rounded-xl overflow-hidden" : "border border-slate-200 rounded-2xl overflow-hidden"}`}>
        {/* En-tête avec mois */}
        <div className={`bg-slate-50 border-b-2 border-slate-300 ${isExportMode ? "p-4" : "p-3"}`}>
          <div className="flex">
            {/* Colonne vide pour les labels d'axes */}
            <div className={`w-[220px] ${isExportMode ? "p-4" : "p-3"} border-r-2 border-slate-300 bg-slate-100`}>
              <div className={`${isExportMode ? "text-sm" : "text-xs"} font-semibold text-slate-600 uppercase tracking-wide`}>
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
                    className={`flex-1 ${isExportMode ? "p-4" : "p-3"} border-r border-slate-200 last:border-r-0 relative bg-white`}
                    style={{ minWidth: "160px" }}
                  >
                    {isQuarterStart && index > 0 && (
                      <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-slate-400" />
                    )}
                    <div className={`${isExportMode ? "text-base" : "text-sm"} font-semibold text-slate-900`}>
                      {month.label}
                    </div>
                    <div className={`${isExportMode ? "text-sm" : "text-xs"} text-slate-500 mt-0.5 font-medium`}>
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
              <div className={`w-[220px] ${isExportMode ? "p-4" : "p-3"} border-r-2 border-slate-300 flex items-center gap-3 flex-shrink-0 bg-slate-50/30`}>
                <div className={`${isExportMode ? "w-12 h-12" : "w-10 h-10"} rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm`}>
                  {IconComponent && (
                    <IconComponent className={`${isExportMode ? "h-6 w-6" : "h-5 w-5"} ${axisColorMap[axis.id]}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${isExportMode ? "text-base" : "text-sm"} font-semibold text-slate-900 leading-tight`}>
                    {axis.label}
                  </div>
                  <div className={`${isExportMode ? "text-sm" : "text-xs"} text-slate-500 mt-0.5`}>
                    {axisItems.length} item{axisItems.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Zone de timeline pour cet axe */}
              <div className={`flex-1 ${isExportMode ? "min-h-[120px]" : "min-h-[100px]"} ${isExportMode ? "p-3" : "p-2"} relative`}>
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
                      className={`absolute top-2 bottom-2 rounded-lg border-2 ${isExportMode ? "px-3 py-2.5" : "px-2.5 py-2"} flex flex-col justify-center ${getTypeColor(
                        item.type,
                        item.status
                      )} shadow-sm ${!isExportMode ? "hover:shadow-md transition-shadow" : ""} z-10`}
                      style={{
                        left: `calc(${leftPercent}% + 8px)`,
                        width: `calc(${widthPercent}% - 16px)`,
                      }}
                      title={item.description}
                    >
                      <div className={`flex items-start justify-between gap-1.5 mb-1`}>
                        <div className={`${isExportMode ? "text-sm" : "text-xs"} font-semibold leading-tight flex-1 min-w-0`}>
                          {item.title}
                        </div>
                        <Chip
                          variant={getBadgeVariant(item.type)}
                          size="sm"
                          className={`flex-shrink-0 ${isExportMode ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0"}`}
                        >
                          {item.type}
                        </Chip>
                      </div>
                      {item.status && (
                        <div className={`${isExportMode ? "text-xs" : "text-[10px]"} text-slate-600 mt-0.5`}>
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
    </div>
  );
}

