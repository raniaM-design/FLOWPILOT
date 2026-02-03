"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { FlowCardContent } from "@/components/ui/flow-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextFormField } from "@/components/forms/rich-text-form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserMentionInput } from "@/components/mentions/user-mention-input";
import { useState } from "react";

interface DecisionFormProps {
  projects: Array<{ id: string; name: string }>;
  action: (formData: FormData) => void;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslations();
  return (
    <Button 
      type="submit" 
      disabled={disabled || pending}
      className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-lg shadow-blue-500/25"
    >
      {pending ? t("decisions.creating") : t("decisions.create")}
    </Button>
  );
}

export function DecisionForm({ projects, action }: DecisionFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const t = useTranslations();

  return (
    <FlowCardContent>
      <form action={action} className="space-y-6">
        <input type="hidden" name="projectId" value={selectedProjectId} />
        <div className="space-y-2">
          <Label htmlFor="projectId" className="text-sm font-medium text-slate-900">
            Projet <span className="text-red-500">*</span>
          </Label>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
              <p className="text-sm text-amber-800 mb-3 font-medium">
                {t("emptyStates.mustCreateProjectFirst")}
              </p>
              <Link href="/app/projects/new">
                <Button type="button" size="sm" variant="outline" className="bg-white border-amber-300 hover:bg-amber-100">
                  {t("forms.createProject")}
                </Button>
              </Link>
            </div>
          ) : (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} required>
              <SelectTrigger id="projectId" className="w-full h-11">
                <SelectValue placeholder="Sélectionnez un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-slate-900">
            Titre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Titre de la décision"
            required
            minLength={2}
            className="w-full h-11"
          />
        </div>

        <RichTextFormField
          id="context"
          name="context"
          label={t("decisions.contextLabel")}
          placeholder="Contexte de la décision (situation, enjeux, options considérées...)"
        />

        <RichTextFormField
          id="decision"
          name="decision"
          label={t("decisions.decisionLabel")}
          placeholder="La décision prise (optionnel, peut être rempli plus tard)"
        />

        <div className="space-y-2">
          <Label htmlFor="decision-mentions" className="text-sm font-medium text-slate-900">
            Mentionner des utilisateurs (optionnel)
          </Label>
          <UserMentionInput
            value={mentionedUserIds}
            onChange={setMentionedUserIds}
            placeholder="Tapez @email pour mentionner..."
          />
          <input
            type="hidden"
            name="mentionedUserIds"
            value={mentionedUserIds.join(",")}
          />
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-slate-200/60">
          <SubmitButton disabled={projects.length === 0 || !selectedProjectId} />
          <Link href="/app/decisions">
            <Button type="button" variant="outline" className="border-slate-300">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </FlowCardContent>
  );
}
