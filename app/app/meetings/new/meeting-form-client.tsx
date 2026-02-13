"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createMeeting, type CreateMeetingResult } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ProjectSelect } from "@/app/app/actions/new/project-select";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { MeetingFormWithMentions } from "./meeting-form-with-mentions";
import { MeetingEditorWithImport, ImportMeetingButton } from "@/components/meetings/meeting-editor-with-import";

interface MeetingFormClientProps {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  today: string;
  t: (key: string) => string;
}

export function MeetingFormClient({
  projects,
  defaultProjectId,
  today,
  t,
}: MeetingFormClientProps) {
  const [state, formAction] = useActionState<CreateMeetingResult | null, FormData>(
    createMeeting,
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 group">
          <Label htmlFor="title" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-600" />
            {t("meetings.titleLabel")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Ex: Réunion produit - Q1 2024"
            required
            className="h-11 border border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-all duration-200"
          />
        </div>

        <div className="space-y-2 group">
          <Label htmlFor="date" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            {t("meetings.dateLabel")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            className="h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div className="space-y-2 group">
          <Label htmlFor="participants" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            {t("meetings.participantsLabel")} <span className="text-xs text-slate-500">(optionnel)</span>
          </Label>
          <Input
            id="participants"
            name="participants"
            placeholder="Ex: Jean Dupont, Marie Martin"
            className="h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <ProjectSelect projects={projects} defaultValue={defaultProjectId} />
        </div>
      </div>

      <div className="space-y-2 group">
        <Label htmlFor="context" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-blue-500" />
          {t("meetings.contextLabel")} <span className="text-xs text-slate-500">(optionnel)</span>
        </Label>
        <Input
          id="context"
          name="context"
          placeholder="Ex: Client XYZ / Contexte additionnel"
          className="h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200"
        />
      </div>

      <MeetingFormWithMentions />

      <div className="space-y-2 group mt-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="raw_notes" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-600" />
            {t("meetings.notesLabel")} <span className="text-red-500">*</span>
          </Label>
          <ImportMeetingButton />
        </div>
        <MeetingEditorWithImport
          id="raw_notes"
          name="raw_notes"
          placeholder={t("meetings.notesPlaceholder")}
          required
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <FormSubmitButton
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 h-auto"
          loadingText="Création..."
        >
          {t("meetings.create")}
        </FormSubmitButton>
        <Link href="/app/meetings">
          <Button
            type="button"
            variant="outline"
            className="border border-slate-300 hover:bg-slate-50 font-medium px-6 py-2.5 h-auto"
          >
            {t("common.cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}
