"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
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
      className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2.5 h-auto"
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
    <form action={action} className="space-y-6">
        <input type="hidden" name="projectId" value={selectedProjectId} />
        <div className="space-y-2 group">
          <Label htmlFor="projectId" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-purple-600" />
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
              <SelectTrigger id="projectId" className="w-full h-11 border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all duration-200">
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

        <div className="space-y-2 group">
          <Label htmlFor="title" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-purple-500" />
            Titre <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="title"
              name="title"
              placeholder="Titre de la décision"
              required
              minLength={2}
              className="h-11 border border-slate-300 focus-visible:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-600/20 transition-all duration-200"
            />
          </div>
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

        <div className="space-y-2 group">
          <Label htmlFor="decision-mentions" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-purple-500" />
            Mentionner des utilisateurs <span className="text-xs text-slate-500">(optionnel)</span>
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

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <SubmitButton disabled={projects.length === 0 || !selectedProjectId} />
          <Link href="/app/decisions">
            <Button 
              type="button" 
              variant="outline" 
              className="border border-slate-300 hover:bg-slate-50 font-medium px-6 py-2.5 h-auto"
            >
              Annuler
            </Button>
          </Link>
        </div>
      </form>
  );
}
