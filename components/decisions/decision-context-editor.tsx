"use client";

import { useState } from "react";
import { RichTextDisplay, RichTextField } from "@/components/ui/rich-text-field";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { updateDecisionContext } from "@/app/app/decisions/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DecisionContextEditorProps {
  decisionId: string;
  initialContext: string | null;
}

export function DecisionContextEditor({ decisionId, initialContext }: DecisionContextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [context, setContext] = useState(initialContext || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDecisionContext(decisionId, context);
      setIsEditing(false);
      toast.success("Contexte mis à jour avec succès");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du contexte:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du contexte");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContext(initialContext || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <RichTextField
          value={context}
          onChange={(html) => setContext(html)}
          placeholder="Contexte de la décision (situation, enjeux, options considérées...)"
          className="min-h-[120px]"
        />
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200/60 min-h-[60px]">
        {initialContext ? (
          <RichTextDisplay content={initialContext} className="text-sm leading-relaxed" />
        ) : (
          <p className="text-sm text-muted-foreground italic text-center">
            Aucun contexte renseigné
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm"
        onClick={() => setIsEditing(true)}
        title="Modifier le contexte"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

