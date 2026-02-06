"use client";

import { useState, useEffect } from "react";
import { UserMentionInput } from "@/components/mentions/user-mention-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DecisionMentionsEditorProps {
  decisionId: string;
}

export function DecisionMentionsEditor({ decisionId }: DecisionMentionsEditorProps) {
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialMentionedUserIds, setInitialMentionedUserIds] = useState<string[]>([]);

  // Charger les mentions existantes
  useEffect(() => {
    const fetchMentions = async () => {
      try {
        const response = await fetch(`/api/decisions/${decisionId}/mentions`);
        if (response.ok) {
          const data = await response.json();
          setMentionedUserIds(data.mentionedUserIds || []);
          setInitialMentionedUserIds(data.mentionedUserIds || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des mentions:", error);
        toast.error("Erreur lors du chargement des mentions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentions();
  }, [decisionId]);

  // Détecter les changements
  useEffect(() => {
    const changed =
      mentionedUserIds.length !== initialMentionedUserIds.length ||
      mentionedUserIds.some((id) => !initialMentionedUserIds.includes(id)) ||
      initialMentionedUserIds.some((id) => !mentionedUserIds.includes(id));
    setHasChanges(changed);
  }, [mentionedUserIds, initialMentionedUserIds]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/decisions/${decisionId}/mentions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentionedUserIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      setInitialMentionedUserIds([...mentionedUserIds]);
      setHasChanges(false);
      toast.success("Mentions mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des mentions:", error);
      toast.error("Erreur lors de la sauvegarde des mentions");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200/50">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          Mentionner des membres
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="decision-mentions" className="text-sm font-medium text-slate-700">
            Ajoutez des membres de l'entreprise pour les notifier
          </Label>
          <UserMentionInput
            value={mentionedUserIds}
            onChange={setMentionedUserIds}
            placeholder="Tapez @email pour mentionner un membre..."
          />
        </div>

        {hasChanges && (
          <div className="flex justify-end pt-2 border-t border-slate-200">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-md shadow-blue-500/25"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les mentions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

