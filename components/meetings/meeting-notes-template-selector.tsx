"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileStack, Loader2, Trash2 } from "lucide-react";
import {
  BUILTIN_MEETING_NOTES_TEMPLATES,
  meetingTemplateMarkdownToHtml,
} from "@/lib/meetings/notes-templates";
import { editorHtmlToTemplateMarkdown } from "@/lib/meetings/html-to-template-markdown";

export type MeetingNotesTemplateSelection = {
  presetKey: string | null;
  customTemplateId: string | null;
};

export type MeetingNotesEditorAdapter = {
  getContent: () => string;
  setContent: (html: string) => void;
};

type UserTpl = { id: string; name: string; bodyMarkdown: string };

type Props = {
  editorAdapter: MeetingNotesEditorAdapter;
  selection: MeetingNotesTemplateSelection;
  onSelectionChange: (s: MeetingNotesTemplateSelection) => void;
  className?: string;
};

export function MeetingNotesTemplateSelector({
  editorAdapter,
  selection,
  onSelectionChange,
  className,
}: Props) {
  const [userTemplates, setUserTemplates] = useState<UserTpl[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveBody, setSaveBody] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/meetings/notes-templates");
      if (!res.ok) throw new Error("fetch");
      const data = await res.json();
      setUserTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch {
      toast.error("Impossible de charger tes modèles");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selectValue = useMemo(() => {
    if (selection.customTemplateId) return `custom:${selection.customTemplateId}`;
    if (selection.presetKey) return `builtin:${selection.presetKey}`;
    return "__none__";
  }, [selection.customTemplateId, selection.presetKey]);

  const handleSelectChange = (v: string) => {
    if (v === "__none__") onSelectionChange({ presetKey: null, customTemplateId: null });
    else if (v.startsWith("builtin:"))
      onSelectionChange({ presetKey: v.slice(8), customTemplateId: null });
    else if (v.startsWith("custom:"))
      onSelectionChange({ presetKey: null, customTemplateId: v.slice(7) });
  };

  const applyTemplate = () => {
    let md = "";
    if (selection.presetKey) {
      md =
        BUILTIN_MEETING_NOTES_TEMPLATES.find((t) => t.id === selection.presetKey)?.markdown ?? "";
    } else if (selection.customTemplateId) {
      md =
        userTemplates.find((t) => t.id === selection.customTemplateId)?.bodyMarkdown ?? "";
    }
    if (!md.trim()) {
      toast.message("Choisis d’abord un modèle dans la liste");
      return;
    }
    const current = editorAdapter.getContent();
    const stripped = current.replace(/<[^>]+>/g, "").replace(/\s+/g, "").trim();
    if (stripped && !window.confirm("Remplacer le contenu actuel par la structure du modèle ?")) {
      return;
    }
    editorAdapter.setContent(meetingTemplateMarkdownToHtml(md));
    toast.success("Structure du modèle insérée");
  };

  const openSaveDialog = () => {
    setSaveName("");
    setSaveBody(editorHtmlToTemplateMarkdown(editorAdapter.getContent()));
    setSaveOpen(true);
  };

  const saveTemplate = async () => {
    const name = saveName.trim();
    const body = saveBody.trim();
    if (!name) {
      toast.error("Indique un nom pour le modèle");
      return;
    }
    if (!body) {
      toast.error("Le modèle ne peut pas être vide");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/meetings/notes-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bodyMarkdown: body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur");
      const tpl = data.template as UserTpl;
      toast.success("Modèle enregistré");
      setSaveOpen(false);
      await loadTemplates();
      if (tpl?.id) {
        onSelectionChange({ presetKey: null, customTemplateId: tpl.id });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm("Supprimer ce modèle ?")) return;
    try {
      const res = await fetch(`/api/meetings/notes-templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Modèle supprimé");
      if (selection.customTemplateId === id) {
        onSelectionChange({ presetKey: null, customTemplateId: null });
      }
      await loadTemplates();
    } catch {
      toast.error("Suppression impossible");
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileStack className="h-4 w-4 text-blue-600" aria-hidden />
            Utiliser un template
          </Label>
          <Select value={selectValue} onValueChange={handleSelectChange} disabled={loadingList}>
            <SelectTrigger className="h-11 border-slate-300 bg-white">
              <SelectValue placeholder="Aucun — contenu libre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Aucun — contenu libre</SelectItem>
              {BUILTIN_MEETING_NOTES_TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={`builtin:${t.id}`}>
                  {t.label}
                </SelectItem>
              ))}
              {userTemplates.map((t) => (
                <SelectItem key={t.id} value={`custom:${t.id}`}>
                  Perso · {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11"
            onClick={applyTemplate}
            disabled={selectValue === "__none__"}
          >
            Appliquer au texte
          </Button>
          <Button type="button" variant="outline" className="h-11" onClick={openSaveDialog}>
            Enregistrer comme modèle…
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-slate-600"
            onClick={() => setManageOpen(true)}
          >
            Mes modèles
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Les titres en <code className="text-[11px] bg-slate-100 px-1 rounded">##</code> deviennent des
        sections dans l’éditeur. Le type de modèle est pris en compte lors de l’analyse IA.
      </p>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau modèle personnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Nom du modèle</Label>
              <Input
                id="tpl-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Ex : Point mensuel client"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">Structure (markdown, titres ##)</Label>
              <Textarea
                id="tpl-body"
                value={saveBody}
                onChange={(e) => setSaveBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={saveTemplate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mes modèles</DialogTitle>
          </DialogHeader>
          {userTemplates.length === 0 ? (
            <p className="text-sm text-slate-600 py-4">Aucun modèle enregistré pour l’instant.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {userTemplates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span className="text-sm font-medium truncate">{t.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-red-600 hover:text-red-700"
                    onClick={() => deleteTemplate(t.id)}
                    aria-label={`Supprimer ${t.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
