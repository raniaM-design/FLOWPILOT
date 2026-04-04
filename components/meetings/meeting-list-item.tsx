"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Loader2 } from "lucide-react";
import { SwipeRevealRow } from "@/components/ui/swipe-reveal-row";
import { cn } from "@/lib/utils";
import type { MeetingAnalysisListStatus } from "@/lib/meetings/meeting-list-meta";
import type { AnalysisQuality } from "@/lib/meetings/analysis-quality";

export type MeetingListItemModel = {
  id: string;
  title: string;
  date: string;
  participants: string | null;
  context: string | null;
  projectId: string | null;
  projectName: string | null;
  notesCount: number;
  decisionsCount: number;
  analysisStatus: MeetingAnalysisListStatus;
  /** Compteurs issus du JSON d’analyse (0 si pas d’analyse) */
  extractedActionsCount: number;
  extractedDecisionsCount: number;
  displayActionsCount: number;
  displayDecisionsCount: number;
  analysisQuality: AnalysisQuality | null;
  canQuickAnalyze: boolean;
  hasNotes: boolean;
};

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  return `${dayName} ${day}`;
}

function formatTimeRange(dateString: string) {
  const date = new Date(dateString);
  const startHour = date.getHours();
  const startMinute = date.getMinutes();
  let endHour = startHour + 1;
  let endMinute = startMinute + 30;
  if (endMinute >= 60) {
    endMinute -= 60;
    endHour += 1;
  }
  if (endHour >= 24) endHour -= 24;
  const fmt = (h: number, m: number) =>
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return `${fmt(startHour, startMinute)} - ${fmt(endHour, endMinute)}`;
}

function AnalysisStatusBadge({ status }: { status: MeetingAnalysisListStatus }) {
  if (status === "analyzed") {
    return (
      <Chip variant="success" size="sm" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-medium">
        Analysée ✓
      </Chip>
    );
  }
  if (status === "partial") {
    return (
      <Chip variant="warning" size="sm" className="bg-orange-50 text-orange-900 border-orange-200 font-medium">
        Analyse partielle ⚠️
      </Chip>
    );
  }
  return (
    <Chip variant="neutral" size="sm" className="bg-slate-100 text-slate-600 border-slate-200 font-medium">
      En attente
    </Chip>
  );
}

function CrQualityBar({ quality }: { quality: AnalysisQuality }) {
  const level = quality === "faible" ? 1 : quality === "moyenne" ? 2 : 3;
  const fillClass =
    quality === "faible" ? "bg-red-400" : quality === "moyenne" ? "bg-amber-400" : "bg-emerald-500";
  const label = quality === "faible" ? "Faible" : quality === "moyenne" ? "Moyen" : "Bon";

  return (
    <div className="flex flex-col gap-1 min-w-[72px]" title={`Qualité du CR : ${label}`}>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2 flex-1 rounded-sm ${step <= level ? fillClass : "bg-slate-200"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-500 font-medium leading-none">{label}</span>
    </div>
  );
}

export function MeetingListItem({
  meeting,
  layout,
  showUpcomingChip,
}: {
  meeting: MeetingListItemModel;
  layout: "expanded" | "compact";
  showUpcomingChip?: boolean;
}) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const analyzeHref = `/app/meetings/${meeting.id}/analyze`;

  const showQuickAnalyze =
    meeting.analysisStatus === "pending" &&
    meeting.canQuickAnalyze &&
    meeting.hasNotes;

  async function handleQuickAnalyze(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setAnalyzing(true);
    try {
      const res = await fetch("/api/meetings/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Analyse impossible");
        return;
      }
      toast.success("Analyse terminée");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setAnalyzing(false);
    }
  }

  const counterLine = `${meeting.displayActionsCount} action${meeting.displayActionsCount !== 1 ? "s" : ""} · ${meeting.displayDecisionsCount} décision${meeting.displayDecisionsCount !== 1 ? "s" : ""}`;

  const metaRow = (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <AnalysisStatusBadge status={meeting.analysisStatus} />
      <span className="text-xs sm:text-sm text-slate-600">{counterLine}</span>
      {meeting.analysisStatus !== "pending" && meeting.analysisQuality != null && (
        <CrQualityBar quality={meeting.analysisQuality} />
      )}
      {showQuickAnalyze && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={analyzing}
          className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={handleQuickAnalyze}
        >
          {analyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>Analyser maintenant →</>
          )}
        </Button>
      )}
    </div>
  );

  const mobileCardLeftBorder =
    meeting.analysisStatus === "analyzed" ? "border-l-emerald-500" : "border-l-slate-400";

  const digestMobile = (
    <div className="md:hidden">
      <SwipeRevealRow
        className="rounded-xl"
        contentClassName="rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        actions={[
          {
            label: "Analyser",
            className: "bg-orange-500",
            onClick: () => router.push(analyzeHref),
          },
          {
            label: "Archiver",
            className: "bg-slate-500",
            onClick: () =>
              toast.message("L’archivage des réunions arrive bientôt.", {
                description: "Cette action sera disponible dans une prochaine version.",
              }),
          },
        ]}
      >
        <Link href={analyzeHref} className="block w-full">
          <div
            className={cn(
              "flex min-h-14 items-center gap-2 rounded-xl border border-[#E5E7EB] border-l-4 bg-white p-4",
              mobileCardLeftBorder,
            )}
          >
            <span className="shrink-0 rounded-full bg-[#EEF2FF] px-3 py-1 text-[11px] font-bold uppercase tracking-tight text-[#3B5BDB]">
              {formatShortDate(meeting.date)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111111]">{meeting.title}</span>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#2563EB]">
              {meeting.displayActionsCount} action{meeting.displayActionsCount !== 1 ? "s" : ""}
            </span>
          </div>
        </Link>
      </SwipeRevealRow>
    </div>
  );

  if (layout === "compact") {
    return (
      <>
        {digestMobile}
        <FlowCard
          variant="default"
          className="hidden md:block bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200"
        >
          <FlowCardContent className="p-5">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0 text-center w-16">
                <div className="text-sm font-semibold text-[#111111] mb-1">
                  {formatShortDate(meeting.date)}
                </div>
                <div className="text-xs text-[#667085]">CR</div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <Link href={analyzeHref} className="block group">
                  <h3 className="text-base font-semibold text-[#111111] mb-2 group-hover:text-[#2563EB] transition-colors">
                    {meeting.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-[#667085] flex-wrap">
                    <span>{formatTimeRange(meeting.date)}</span>
                    {meeting.projectName && (
                      <Chip variant="info" size="sm" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                        {meeting.projectName}
                      </Chip>
                    )}
                    {meeting.notesCount > 0 && (
                      <Chip variant="neutral" size="sm" className="bg-[#F8FAFC] text-[#667085] border-[#E5E7EB]">
                        {meeting.notesCount} notes
                      </Chip>
                    )}
                  </div>
                </Link>
                {metaRow}
              </div>
              <Link href={analyzeHref} className="flex-shrink-0 mt-1" aria-label="Ouvrir la réunion">
                <ArrowRight className="h-5 w-5 text-[#667085] hover:text-[#2563EB] transition-colors" />
              </Link>
            </div>
          </FlowCardContent>
        </FlowCard>
      </>
    );
  }

  return (
    <>
      {digestMobile}
      <FlowCard
        variant="default"
        className="hidden md:block bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200"
      >
        <FlowCardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 text-center sm:text-left">
              <div className="text-sm font-semibold text-[#111111] mb-1">{formatShortDate(meeting.date)}</div>
              <div className="text-xs text-[#667085]">CR</div>
            </div>
            <div className="flex-1 min-w-0 w-full space-y-3">
              <Link href={analyzeHref} className="block group">
                <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-2 group-hover:text-[#2563EB] transition-colors">
                  {meeting.title}
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2 text-sm text-[#667085]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTimeRange(meeting.date)}
                  </span>
                  <span>Distanciel</span>
                </div>
              </Link>
              {metaRow}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2">
                {meeting.projectName && (
                  <Chip variant="info" size="sm" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                    {meeting.projectName}
                  </Chip>
                )}
                {showUpcomingChip && (
                  <Chip variant="success" size="sm" className="bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]">
                    À venir
                  </Chip>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[#E5E7EB] border-2 border-white" />
                  ))}
                </div>
                <Link href={analyzeHref}>
                  <Button size="sm" variant="outline" className="text-sm border-[#E5E7EB]">
                    Ouvrir
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </FlowCardContent>
      </FlowCard>
    </>
  );
}
