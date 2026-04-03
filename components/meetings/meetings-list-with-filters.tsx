"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearch } from "@/contexts/search-context";
import {
  MeetingListItem,
  type MeetingListItemModel,
} from "@/components/meetings/meeting-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, FileText, ArrowRight } from "lucide-react";

export type MeetingListRow = MeetingListItemModel;

export type MeetingsTab = "upcoming" | "analyzed" | "notAnalyzed" | "archived";

interface MeetingsListWithFiltersProps {
  meetings: MeetingListRow[];
  initialTab?: MeetingsTab;
}

function isAnalyzedWithOutput(m: MeetingListRow): boolean {
  return (
    m.analysisStatus !== "pending" &&
    (m.extractedActionsCount > 0 || m.extractedDecisionsCount > 0)
  );
}

function isPendingAnalysis(m: MeetingListRow): boolean {
  return m.hasNotes && m.analysisStatus === "pending";
}

export function MeetingsListWithFilters({
  meetings,
  initialTab,
}: MeetingsListWithFiltersProps) {
  const [activeTab, setActiveTab] = useState<MeetingsTab>(
    initialTab ?? "upcoming",
  );
  const { searchQuery } = useSearch();

  const nowStart = useMemo(() => {
    const n = new Date();
    n.setHours(0, 0, 0, 0);
    return n;
  }, []);

  const counts = useMemo(() => {
    const upcoming = meetings.filter((m) => {
      const d = new Date(m.date);
      d.setHours(0, 0, 0, 0);
      return d >= nowStart;
    }).length;
    return {
      upcoming,
      analyzed: meetings.filter(isAnalyzedWithOutput).length,
      notAnalyzed: meetings.filter(isPendingAnalysis).length,
      archived: 0,
    };
  }, [meetings, nowStart]);

  const pendingSorted = useMemo(
    () =>
      [...meetings]
        .filter(isPendingAnalysis)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [meetings],
  );

  const bulkAnalyzeHref = pendingSorted[0]
    ? `/app/meetings/${pendingSorted[0].id}/analyze`
    : "/app/meetings/new";

  const baseList = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return meetings.filter((m) => {
          const d = new Date(m.date);
          d.setHours(0, 0, 0, 0);
          return d >= nowStart;
        });
      case "analyzed":
        return meetings.filter(isAnalyzedWithOutput);
      case "notAnalyzed":
        return meetings.filter(isPendingAnalysis);
      case "archived":
        return [];
      default:
        return meetings;
    }
  }, [activeTab, meetings, nowStart]);

  const filteredMeetings = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return baseList;
    }
    const query = searchQuery.toLowerCase().trim();
    return baseList.filter((meeting) => {
      const titleMatch = meeting.title?.toLowerCase().includes(query) || false;
      const projectMatch =
        meeting.projectName?.toLowerCase().includes(query) || false;
      const participantsMatch =
        meeting.participants?.toLowerCase().includes(query) || false;
      const contextMatch =
        meeting.context?.toLowerCase().includes(query) || false;
      return (
        titleMatch || projectMatch || participantsMatch || contextMatch
      );
    });
  }, [baseList, searchQuery]);

  const listForTab = filteredMeetings;

  const sectionTitle =
    activeTab === "upcoming"
      ? "À venir"
      : activeTab === "analyzed"
        ? "Analysées"
        : activeTab === "notAnalyzed"
          ? "Non analysées"
          : "Archivées";

  const showBulkAnalyzeCta =
    activeTab === "notAnalyzed" && counts.notAnalyzed > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as MeetingsTab)}
          >
            <TabsList className="bg-white border border-[#E5E7EB] w-max min-w-full sm:min-w-0">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                À venir{" "}
                {counts.upcoming > 0 && (
                  <span className="ml-1.5">({counts.upcoming})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="analyzed"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                Analysées{" "}
                {counts.analyzed > 0 && (
                  <span className="ml-1.5">({counts.analyzed})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="notAnalyzed"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                Non analysées{" "}
                {counts.notAnalyzed > 0 && (
                  <span className="ml-1.5">({counts.notAnalyzed})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap"
              >
                Archivées{" "}
                {counts.archived > 0 && (
                  <span className="ml-1.5">({counts.archived})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {showBulkAnalyzeCta && (
          <Link
            href={bulkAnalyzeHref}
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:brightness-105 hover:shadow-lg"
          >
            Analyser toutes ({counts.notAnalyzed})
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-[#667085]">
            <span>Filtrer : </span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as MeetingsTab)}
              className="bg-transparent border-0 outline-none text-[#111111] font-medium cursor-pointer"
            >
              <option value="upcoming">À venir</option>
              <option value="analyzed">Analysées</option>
              <option value="notAnalyzed">Non analysées</option>
              <option value="archived">Archivées</option>
            </select>
          </div>
          <div className="px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <span className="text-sm font-semibold text-[#111111]">
              {filteredMeetings.length} résultat
              {filteredMeetings.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {listForTab.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#111111]">
              {sectionTitle}
            </h2>
            <span className="text-sm text-[#667085]">
              {listForTab.length} résultat
              {listForTab.length > 1 ? "s" : ""}
            </span>
          </div>
          {listForTab.map((meeting) => (
            <MeetingListItem
              key={meeting.id}
              meeting={meeting}
              layout={activeTab === "upcoming" ? "expanded" : "compact"}
              showUpcomingChip={activeTab === "upcoming"}
            />
          ))}
        </div>
      )}

      {listForTab.length === 0 &&
        (activeTab === "upcoming" ? (
          <EmptyState
            icon={CalendarDays}
            title="Pas de réunion prévue"
            description="Connecte ton calendrier Outlook pour les importer automatiquement."
            ctaLabel="Voir l'intégration"
            ctaAction="/app/integrations/outlook"
          />
        ) : activeTab === "analyzed" ? (
          <EmptyState
            icon={FileText}
            title="Aucune réunion analysée"
            description="Aucune réunion n’a encore été analysée par l’IA avec au moins une action ou une décision extraite."
            ctaLabel="Voir les non analysées"
            ctaAction="/app/meetings?tab=notAnalyzed"
          />
        ) : activeTab === "notAnalyzed" ? (
          counts.notAnalyzed === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tout est analysé"
              description="Tous tes comptes rendus saisis ont été passés en analyse — ou tu n’as pas encore de notes à traiter."
              ctaLabel="Nouveau compte rendu"
              ctaAction="/app/meetings/new"
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Aucun résultat"
              description="Aucune réunion ne correspond à ta recherche dans cet onglet."
              ctaLabel="Réinitialiser la recherche"
              ctaAction="/app/meetings?tab=notAnalyzed"
            />
          )
        ) : (
          <EmptyState
            icon={FileText}
            title="Archivées"
            description="L’archivage des réunions arrive bientôt."
            ctaLabel="Retour aux réunions"
            ctaAction="/app/meetings"
          />
        ))}
    </div>
  );
}
