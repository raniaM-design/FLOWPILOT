"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { CalendarDays, Calendar, Clock, Users, FileText, Target, Plus, CheckCircle2, ArrowRight } from "lucide-react";
import { useSearch } from "@/contexts/search-context";

interface Meeting {
  id: string;
  title: string;
  date: string; // ISO string
  participants: string | null;
  context: string | null;
  projectId: string | null;
  projectName: string | null;
  decisionsCount: number;
  notesCount: number;
}

interface MeetingsListWithFiltersProps {
  meetings: Meeting[];
}

export function MeetingsListWithFilters({ meetings }: MeetingsListWithFiltersProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "decisions" | "archived">("upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const { searchQuery } = useSearch();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Séparer les réunions en catégories
  const meetingsByCategory = useMemo(() => {
    const upcoming: Meeting[] = [];
    const past: Meeting[] = [];
    const archived: Meeting[] = [];

    meetings.forEach((meeting) => {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);

      // Pour l'instant, on considère qu'il n'y a pas de statut "archived" dans le modèle
      // On peut utiliser une logique basée sur la date ou un champ à ajouter
      if (meetingDate >= now) {
        upcoming.push(meeting);
      } else {
        past.push(meeting);
      }
    });

    return { upcoming, past, archived };
  }, [meetings, now]);

  // Filtrer selon l'onglet actif
  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case "upcoming":
        return meetingsByCategory.upcoming;
      case "past":
        return meetingsByCategory.past;
      case "decisions":
        // Pour l'instant, on retourne toutes les réunions avec des décisions
        return meetings.filter((m) => m.decisionsCount > 0);
      case "archived":
        return meetingsByCategory.archived;
      default:
        return meetings;
    }
  }, [meetingsByCategory, activeTab, meetings]);

  // Filtrer selon le filtre de statut
  const filteredByStatus = useMemo(() => {
    if (statusFilter === "all") {
      return filteredByTab;
    }
    return filteredByTab;
  }, [filteredByTab, statusFilter]);

  // Filtrer selon la recherche textuelle
  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredByStatus;
    }

    const query = searchQuery.toLowerCase().trim();
    return filteredByStatus.filter((meeting) => {
      const titleMatch = meeting.title.toLowerCase().includes(query);
      const projectMatch = meeting.projectName?.toLowerCase().includes(query) || false;
      const participantsMatch = meeting.participants?.toLowerCase().includes(query) || false;
      const contextMatch = meeting.context?.toLowerCase().includes(query) || false;
      return titleMatch || projectMatch || participantsMatch || contextMatch;
    });
  }, [filteredByStatus, searchQuery]);

  // Compter les réunions par catégorie
  const counts = useMemo(() => {
    const upcoming = meetingsByCategory.upcoming.length;
    const past = meetingsByCategory.past.length;
    const decisions = meetings.filter((m) => m.decisionsCount > 0).length;
    const archived = meetingsByCategory.archived.length;
    return { upcoming, past, decisions, archived };
  }, [meetingsByCategory, meetings]);

  // Formater la date en format court (MAR 23)
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    return `${dayName} ${day}`;
  };

  // Formater l'heure (15:30 - 17:00)
  const formatTimeRange = (dateString: string) => {
    const date = new Date(dateString);
    // Simuler une durée d'1h30 par défaut
    const startHour = date.getHours();
    const startMinute = date.getMinutes();
    
    let endHour = startHour + 1;
    let endMinute = startMinute + 30;
    
    if (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
    }
    if (endHour >= 24) {
      endHour -= 24;
    }
    
    const formatTime = (h: number, m: number) => {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };
    
    return `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;
  };

  // Déterminer si la réunion est à venir
  const isUpcoming = (dateString: string) => {
    const meetingDate = new Date(dateString);
    meetingDate.setHours(0, 0, 0, 0);
    return meetingDate >= now;
  };

  return (
    <div className="space-y-6">
      {/* Tabs et filtres */}
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="bg-white border border-[#E5E7EB] w-max min-w-full sm:min-w-0">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap">
                À venir {counts.upcoming > 0 && <span className="ml-1.5">({counts.upcoming})</span>}
              </TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap">
                Passées {counts.past > 0 && <span className="ml-1.5">({counts.past})</span>}
              </TabsTrigger>
              <TabsTrigger value="decisions" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap">
                Décisions {counts.decisions > 0 && <span className="ml-1.5">({counts.decisions})</span>}
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white whitespace-nowrap">
                Archivées {counts.archived > 0 && <span className="ml-1.5">({counts.archived})</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Dropdown filtre et compteur */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-[#667085]">
            <span>Filtrer : </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 outline-none text-[#111111] font-medium cursor-pointer"
            >
              <option value="all">Tous</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passées</option>
            </select>
          </div>
          <div className="px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
            <span className="text-sm font-semibold text-[#111111]">
              {filteredMeetings.length} résultat{filteredMeetings.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Section À venir */}
      {activeTab === "upcoming" && meetingsByCategory.upcoming.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111111]">À venir</h2>
            <span className="text-sm text-[#667085]">{meetingsByCategory.upcoming.length} résultats</span>
          </div>
          {meetingsByCategory.upcoming.map((meeting) => (
            <Link key={meeting.id} href={`/app/meetings/${meeting.id}/analyze`} className="block group">
              <FlowCard variant="default" className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200">
                <FlowCardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    {/* Date à gauche */}
                    <div className="flex-shrink-0 text-center sm:text-left">
                      <div className="text-sm font-semibold text-[#111111] mb-1">
                        {formatShortDate(meeting.date)}
                      </div>
                      <div className="text-xs text-[#667085]">AVT</div>
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-2 group-hover:text-[#2563EB] transition-colors">
                        {meeting.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 text-sm text-[#667085]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {formatTimeRange(meeting.date)}
                        </span>
                        <span>Distanciel</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                        {meeting.projectName && (
                          <Chip variant="info" size="sm" className="bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                            {meeting.projectName}
                          </Chip>
                        )}
                        <Chip variant="success" size="sm" className="bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]">
                          À venir
                        </Chip>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                        <div className="flex items-center gap-3">
                          {/* Placeholder pour avatars */}
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-[#E5E7EB] border-2 border-white"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-sm border-[#E5E7EB] hover:bg-[#F1F5F9]"
                            onClick={(e) => {
                              e.preventDefault();
                              // TODO: Ouvrir modal pour notes
                            }}
                          >
                            Notes
                          </Button>
                          {meeting.decisionsCount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-sm border-[#E5E7EB] hover:bg-[#F1F5F9]"
                              onClick={(e) => {
                                e.preventDefault();
                                // TODO: Voir décisions
                              }}
                            >
                              Décisions {meeting.decisionsCount}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              // TODO: Ajouter décision
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Décision
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </FlowCardContent>
              </FlowCard>
            </Link>
          ))}
        </div>
      )}

      {/* Section Passées */}
      {activeTab === "past" && meetingsByCategory.past.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111111]">Passées</h2>
            <span className="text-sm text-[#667085]">{meetingsByCategory.past.length} résultats</span>
          </div>
          {meetingsByCategory.past.slice(0, 5).map((meeting) => (
            <Link key={meeting.id} href={`/app/meetings/${meeting.id}/analyze`} className="block group">
              <FlowCard variant="default" className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all duration-200">
                <FlowCardContent className="p-5">
                  <div className="flex items-start gap-6">
                    {/* Date à gauche */}
                    <div className="flex-shrink-0 text-center w-16">
                      <div className="text-sm font-semibold text-[#111111] mb-1">
                        {formatShortDate(meeting.date)}
                      </div>
                      <div className="text-xs text-[#667085]">AVT</div>
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0">
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
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#667085] flex-shrink-0 group-hover:text-[#2563EB] transition-colors mt-1" />
                  </div>
                </FlowCardContent>
              </FlowCard>
            </Link>
          ))}
          {meetingsByCategory.past.length > 5 && (
            <div className="text-center pt-4">
              <Link href="/app/meetings?tab=past" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Voir toutes les réunions →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {filteredMeetings.length === 0 && (
        <FlowCard variant="default" className="bg-white border border-[#E5E7EB]">
          <FlowCardContent className="p-16 text-center">
            <p className="text-sm text-[#667085]">
              Aucune réunion ne correspond aux filtres sélectionnés.
            </p>
          </FlowCardContent>
        </FlowCard>
      )}
    </div>
  );
}

