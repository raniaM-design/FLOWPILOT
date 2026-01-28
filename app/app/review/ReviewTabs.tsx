"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

type ReviewPeriod = "week" | "month";

interface ReviewTabsProps {
  activePeriod: ReviewPeriod;
}

export function ReviewTabs({ activePeriod }: ReviewTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("review");

  const handlePeriodChange = (value: string) => {
    const newPeriod = value as ReviewPeriod;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.replace(`/app/review?${params.toString()}`);
  };

  return (
    <Tabs value={activePeriod} onValueChange={handlePeriodChange} className="w-full">
      <TabsList className="bg-white border border-[#E5E7EB] grid w-full max-w-md grid-cols-2">
        <TabsTrigger 
          value="week" 
          className="text-sm font-medium data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
        >
          {t("weekly.label")}
        </TabsTrigger>
        <TabsTrigger 
          value="month" 
          className="text-sm font-medium data-[state=active]:bg-[#2563EB] data-[state=active]:text-white"
        >
          {t("monthly.label")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

