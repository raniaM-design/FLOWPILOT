"use client";

import Link from "next/link";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Chip } from "@/components/ui/chip";
import { Calendar, Users as UsersIcon, Sparkles, CalendarDays } from "lucide-react";
import { formatShortDate } from "@/lib/timeUrgency";
import { EntityActionsMenu } from "@/components/common/entity-actions-menu";
import { useTranslations } from "next-intl";

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    date: Date;
    participants: string | null;
    context: string | null;
    raw_notes: string;
  };
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const t = useTranslations("meetings");

  return (
    <div className="relative group">
      <Link href={`/app/meetings/${meeting.id}/analyze`} className="block">
        <FlowCard variant="default" className="hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer">
          <FlowCardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Titre avec icône Réunion systématique */}
                <div className="flex items-start gap-2 mb-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                  <h3 className="text-lg font-semibold text-foreground leading-tight">
                    {meeting.title}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Chip variant="neutral" size="sm">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    {formatShortDate(meeting.date)}
                  </Chip>
                  {meeting.participants && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <UsersIcon className="h-3.5 w-3.5" />
                      <span>{meeting.participants}</span>
                    </div>
                  )}
                  {meeting.context && (
                    <Chip variant="info" size="sm">
                      {meeting.context}
                    </Chip>
                  )}
                </div>
                {meeting.raw_notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {meeting.raw_notes.substring(0, 150)}...
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>{t("analyze")}</span>
                </div>
              </div>
            </div>
          </FlowCardContent>
        </FlowCard>
      </Link>
      {/* Menu actions positionné en overlay pour éviter de bloquer le clic */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <EntityActionsMenu
          entityType="meeting"
          entityId={meeting.id}
          entityLabel={meeting.title}
          redirectTo="/app/meetings"
        />
      </div>
    </div>
  );
}

