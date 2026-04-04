"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  MeetingNotesTemplateSelector,
  type MeetingNotesTemplateSelection,
} from "@/components/meetings/meeting-notes-template-selector";
import type { MeetingEditorFormFieldRef } from "@/components/meetings/meeting-editor-form-field";
import { cn } from "@/lib/utils";

interface MeetingFormClientProps {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  today: string;
}

function StepSection({
  stepIndex,
  activeStep,
  children,
  className,
}: {
  stepIndex: number;
  activeStep: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-4",
        activeStep !== stepIndex ? "hidden md:block" : "block",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MeetingFormClient({
  projects,
  defaultProjectId,
  today,
}: MeetingFormClientProps) {
  const t = useTranslations();
  const editorRef = useRef<MeetingEditorFormFieldRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [mobileStep, setMobileStep] = useState(1);

  const [templateSelection, setTemplateSelection] = useState<MeetingNotesTemplateSelection>({
    presetKey: null,
    customTemplateId: null,
  });
  const editorAdapter = useMemo(
    () => ({
      getContent: () => editorRef.current?.getContent() ?? "",
      setContent: (html: string) => editorRef.current?.setContent(html),
    }),
    [],
  );

  const [state, formAction] = useActionState<CreateMeetingResult | null, FormData>(
    createMeeting,
    null,
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  const validateStep1 = (): boolean => {
    const form = formRef.current;
    if (!form) return false;
    const title = form.querySelector<HTMLInputElement>("#title");
    const date = form.querySelector<HTMLInputElement>("#date");
    const project = form.querySelector<HTMLInputElement>('input[name="projectId"]');
    if (title && !title.checkValidity()) {
      title.reportValidity();
      return false;
    }
    if (date && !date.checkValidity()) {
      date.reportValidity();
      return false;
    }
    if (project && !project.checkValidity()) {
      project.reportValidity();
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (mobileStep === 1 && !validateStep1()) return;
    setMobileStep((s) => Math.min(3, s + 1));
  };

  const goPrev = () => setMobileStep((s) => Math.max(1, s - 1));

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {/* Stepper — mobile uniquement */}
      <div className="flex flex-col gap-2 md:hidden" aria-label="Étapes du formulaire">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-full text-xs font-bold touch-manipulation",
                  mobileStep === n
                    ? "bg-blue-600 text-white"
                    : mobileStep > n
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200 text-slate-600",
                )}
              >
                {n}
              </div>
              {n < 3 && <div className="h-px w-6 bg-slate-200" aria-hidden />}
            </div>
          ))}
        </div>
        <p className="text-center text-xs font-medium text-slate-600">
          {mobileStep === 1 && "Infos principales"}
          {mobileStep === 2 && "Participants"}
          {mobileStep === 3 && "Compte rendu"}
        </p>
      </div>

      <StepSection stepIndex={1} activeStep={mobileStep}>
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
              className="h-11 min-h-11 border border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-all duration-200 touch-manipulation"
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
              className="h-11 min-h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200 touch-manipulation"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <ProjectSelect projects={projects} defaultValue={defaultProjectId} />
          </div>
        </div>
      </StepSection>

      <StepSection stepIndex={2} activeStep={mobileStep}>
        <div className="space-y-2 group">
          <Label htmlFor="participants" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            {t("meetings.participantsLabel")} <span className="text-xs text-slate-500">(optionnel)</span>
          </Label>
          <Input
            id="participants"
            name="participants"
            inputMode="email"
            autoComplete="email"
            placeholder="Ex: jean@entreprise.com, marie@entreprise.com"
            className="h-11 min-h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200 touch-manipulation"
          />
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
            className="h-11 min-h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200 touch-manipulation"
          />
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
            className="h-11 min-h-11 border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all duration-200 touch-manipulation"
          />
        </div>
        <MeetingFormWithMentions />
      </StepSection>

      <StepSection stepIndex={3} activeStep={mobileStep} className="flex flex-col min-h-0">
        <div className="space-y-2 group mt-0 md:mt-6 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <Label htmlFor="raw_notes" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-600" />
              {t("meetings.notesLabel")} <span className="text-red-500">*</span>
            </Label>
            <div className="max-md:hidden">
              <ImportMeetingButton />
            </div>
          </div>
          <div className="md:hidden mb-2">
            <ImportMeetingButton />
          </div>
          <MeetingNotesTemplateSelector
            className="mb-4"
            editorAdapter={editorAdapter}
            selection={templateSelection}
            onSelectionChange={setTemplateSelection}
          />
          <input
            type="hidden"
            name="notes_template_preset"
            value={templateSelection.presetKey ?? ""}
          />
          <input
            type="hidden"
            name="notes_custom_template_id"
            value={templateSelection.customTemplateId ?? ""}
          />
          <div className="rounded-lg border border-slate-200 overflow-hidden max-md:min-h-[70dvh] flex flex-col flex-1">
            <MeetingEditorWithImport
              ref={editorRef}
              id="raw_notes"
              name="raw_notes"
              placeholder={t("meetings.notesPlaceholder")}
              required
            />
          </div>
        </div>
      </StepSection>

      {/* Navigation mobile */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 md:hidden">
        {mobileStep > 1 && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 touch-manipulation"
            onClick={goPrev}
          >
            Précédent
          </Button>
        )}
        {mobileStep < 3 && (
          <Button type="button" className="min-h-11 touch-manipulation bg-blue-600 hover:bg-blue-700" onClick={goNext}>
            Suivant
          </Button>
        )}
        {mobileStep === 3 && (
          <>
            <FormSubmitButton
              className="min-h-11 touch-manipulation bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
              loadingText="Création..."
            >
              {t("meetings.create")}
            </FormSubmitButton>
            <Link href="/app/meetings" className="inline-flex min-h-11 items-center touch-manipulation">
              <Button type="button" variant="outline" className="min-h-11 w-full border border-slate-300">
                {t("common.cancel")}
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Actions desktop */}
      <div className="hidden md:flex gap-3 pt-4 border-t border-slate-200">
        <FormSubmitButton
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 h-auto min-h-11 touch-manipulation"
          loadingText="Création..."
        >
          {t("meetings.create")}
        </FormSubmitButton>
        <Link href="/app/meetings">
          <Button
            type="button"
            variant="outline"
            className="border border-slate-300 hover:bg-slate-50 font-medium px-6 py-2.5 h-auto min-h-11 touch-manipulation"
          >
            {t("common.cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}
