"use client";

import { Calendar, CheckSquare2, AlertCircle, Scale } from "lucide-react";
import { useTranslations } from "next-intl";

interface MonthlyKPICardsProps {
  meetings: number;
  actionsCompleted: number;
  actionsOverdue: number;
  decisions: number;
}

export function MonthlyKPICards({
  meetings,
  actionsCompleted,
  actionsOverdue,
  decisions,
}: MonthlyKPICardsProps) {
  const t = useTranslations("review.monthly");
  const cards = [
    {
      label: t("kpis.meetings"),
      value: meetings,
      icon: Calendar,
      bgColor: "bg-[#F0FDF4]",
      iconColor: "text-[#059669]",
      borderColor: "border-[#D1FAE5]",
      textColor: "text-[#059669]",
      labelColor: "text-[#059669]",
    },
    {
      label: t("kpis.actionsCompleted"),
      value: actionsCompleted,
      icon: CheckSquare2,
      bgColor: "bg-[#F0FDF4]",
      iconColor: "text-[#059669]",
      borderColor: "border-[#D1FAE5]",
      textColor: "text-[#059669]",
      labelColor: "text-[#059669]",
    },
    {
      label: t("kpis.actionsOverdue"),
      value: actionsOverdue,
      icon: AlertCircle,
      bgColor: "bg-[#FEF2F2]",
      iconColor: "text-[#DC2626]",
      borderColor: "border-[#FEE2E2]",
      textColor: "text-[#DC2626]",
      labelColor: "text-[#DC2626]",
    },
    {
      label: t("kpis.decisions"),
      value: decisions,
      icon: Scale,
      bgColor: "bg-[#F0FDF4]",
      iconColor: "text-[#059669]",
      borderColor: "border-[#D1FAE5]",
      textColor: "text-[#059669]",
      labelColor: "text-[#059669]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`${card.bgColor} ${card.borderColor} border rounded-xl shadow-sm p-6`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${card.labelColor} mb-2`}>
                  {card.label}
                </p>
                <p className={`text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0 border ${card.borderColor}`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
