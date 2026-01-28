import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewTabs } from "./ReviewTabs";
import { ReviewHeaderActions } from "./ReviewHeaderActions";
import { WeeklyReview } from "./WeeklyReview";
import { MonthlyReview } from "./MonthlyReview";
import { getTranslations } from "next-intl/server";

type ReviewPeriod = "week" | "month";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const userId = await getCurrentUserId();
  const t = await getTranslations("review");

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const periodParam = params.period;
  
  // Valider et normaliser la période
  const period: ReviewPeriod = 
    periodParam === "month" ? "month" : "week";

  // Formater la date pour le sous-titre
  const formatDateRange = (period: ReviewPeriod) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (period === "week") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        start: sevenDaysAgo.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        end: now.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
      };
    } else {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        start: thirtyDaysAgo.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        end: now.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
      };
    }
  };

  const dateRange = formatDateRange(period);

  return (
    <div className="space-y-8">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-semibold text-[#111111] leading-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-base text-[#667085] leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <ReviewHeaderActions period={period} />
        </div>
      </div>

      {/* Tabs */}
      <ReviewTabs activePeriod={period} />

      {/* Contenu selon la période */}
      {period === "week" ? <WeeklyReview /> : <MonthlyReview />}
    </div>
  );
}

