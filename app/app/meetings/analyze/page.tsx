"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MeetingExtraction } from "@/lib/meetings/meeting-extraction-schema";
import { Loader2, FileText, CheckCircle2, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyzeMeetingPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cleanedText, setCleanedText] = useState("");
  const [extracted, setExtracted] = useState<MeetingExtraction | null>(null);
  const [selections, setSelections] = useState<{
    decisions: string[];
    actions: string[];
    risks: string[];
    questions: string[];
    next_steps: string[];
  }>({
    decisions: [],
    actions: [],
    risks: [],
    questions: [],
    next_steps: [],
  });
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!rawText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/meetings/analyze-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const data = await response.json();
      setCleanedText(data.cleanedText);
      setExtracted(data.extracted);
      
      // Sélectionner tout par défaut
      setSelections({
        decisions: data.extracted.decisions.map((d) => d.id),
        actions: data.extracted.actions.map((a) => a.id),
        risks: data.extracted.risks.map((r) => r.id),
        questions: data.extracted.open_questions.map((q) => q.id),
        next_steps: data.extracted.next_steps.map((n) => n.id),
      });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (type: keyof typeof selections, id: string) => {
    setSelections((prev) => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter((i) => i !== id)
        : [...prev[type], id],
    }));
  };

  const handleSave = async () => {
    if (!extracted) return;

    const totalSelected =
      selections.decisions.length +
      selections.actions.length +
      selections.risks.length +
      selections.questions.length +
      selections.next_steps.length;

    if (totalSelected === 0) {
      alert("Sélectionnez au moins un élément à enregistrer");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/meetings/save-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanedText,
          extracted,
          selections,
          meetingData: {
            title: extracted.meta.title || "Réunion analysée",
            date: extracted.meta.date || new Date().toISOString().split("T")[0],
            participants: extracted.meta.attendees.map((a) => a.name).join(", "),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const data = await response.json();
      router.push(`/app/meetings/${data.meetingId}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const totalSelected =
    selections.decisions.length +
    selections.actions.length +
    selections.risks.length +
    selections.questions.length +
    selections.next_steps.length;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Analyser un compte-rendu</h1>
        <p className="text-slate-600">Collez votre CR brut et obtenez une analyse structurée</p>
      </div>

      {!extracted ? (
        <div className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Collez votre compte-rendu ou vos notes ici..."
            className="min-h-[300px] font-mono text-sm"
          />
          <Button onClick={handleAnalyze} disabled={loading || !rawText.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              "Analyser"
            )}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche : CR propre */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CR propre
            </h2>
            <Textarea
              value={cleanedText}
              onChange={(e) => setCleanedText(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
            />
          </div>

          {/* Colonne droite : Éléments extraits */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Éléments extraits</h2>
              <Badge variant="outline">{totalSelected} sélectionné(s)</Badge>
            </div>

            <Tabs defaultValue="decisions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="decisions">
                  Décisions ({extracted.decisions.length})
                </TabsTrigger>
                <TabsTrigger value="actions">
                  Actions ({extracted.actions.length})
                </TabsTrigger>
                <TabsTrigger value="risks">
                  Risques ({extracted.risks.length})
                </TabsTrigger>
                <TabsTrigger value="questions">
                  Questions ({extracted.open_questions.length})
                </TabsTrigger>
                <TabsTrigger value="next_steps">
                  Prochaines étapes ({extracted.next_steps.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="decisions" className="space-y-2">
                {extracted.decisions.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    owner={item.owner}
                    when={item.when}
                    confidence={item.confidence}
                    evidence={item.evidence}
                    selected={selections.decisions.includes(item.id)}
                    onToggle={() => toggleSelection("decisions", item.id)}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                ))}
                {extracted.decisions.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">Aucune décision</p>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-2">
                {extracted.actions.map((item) => (
                  <ActionCard
                    key={item.id}
                    item={item}
                    selected={selections.actions.includes(item.id)}
                    onToggle={() => toggleSelection("actions", item.id)}
                  />
                ))}
                {extracted.actions.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">Aucune action</p>
                )}
              </TabsContent>

              <TabsContent value="risks" className="space-y-2">
                {extracted.risks.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    owner={null}
                    when={null}
                    confidence={item.confidence}
                    evidence={item.evidence}
                    selected={selections.risks.includes(item.id)}
                    onToggle={() => toggleSelection("risks", item.id)}
                    icon={<AlertCircle className="h-4 w-4" />}
                    severity={item.severity}
                  />
                ))}
                {extracted.risks.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">Aucun risque</p>
                )}
              </TabsContent>

              <TabsContent value="questions" className="space-y-2">
                {extracted.open_questions.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    owner={item.owner}
                    when={null}
                    confidence={item.confidence}
                    evidence={item.evidence}
                    selected={selections.questions.includes(item.id)}
                    onToggle={() => toggleSelection("questions", item.id)}
                    icon={<HelpCircle className="h-4 w-4" />}
                  />
                ))}
                {extracted.open_questions.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">Aucune question</p>
                )}
              </TabsContent>

              <TabsContent value="next_steps" className="space-y-2">
                {extracted.next_steps.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    owner={item.owner}
                    when={item.when}
                    confidence={item.confidence}
                    evidence={item.evidence}
                    selected={selections.next_steps.includes(item.id)}
                    onToggle={() => toggleSelection("next_steps", item.id)}
                    icon={<ArrowRight className="h-4 w-4" />}
                  />
                ))}
                {extracted.next_steps.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">Aucune étape</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || totalSelected === 0}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  `Enregistrer ${totalSelected} élément(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  id,
  text,
  owner,
  when,
  confidence,
  evidence,
  selected,
  onToggle,
  icon,
  severity,
}: {
  id: string;
  text: string;
  owner: string | null;
  when: string | null;
  confidence: "high" | "medium" | "low";
  evidence: string;
  selected: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  severity?: "low" | "medium" | "high" | null;
}) {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <div className="text-slate-500 mt-0.5">{icon}</div>
            <p className="text-sm flex-1">{text}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {owner && <Badge variant="outline">{owner}</Badge>}
            {when && <Badge variant="outline">{when}</Badge>}
            {severity && (
              <Badge variant={severity === "high" ? "destructive" : "secondary"}>
                {severity}
              </Badge>
            )}
            <Badge
              variant={
                confidence === "high" ? "default" : confidence === "medium" ? "secondary" : "outline"
              }
            >
              {confidence}
            </Badge>
          </div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showEvidence ? "Masquer" : "Voir"} preuve
          </button>
          {showEvidence && (
            <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">
              "{evidence}"
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ActionCard({
  item,
  selected,
  onToggle,
}: {
  item: MeetingExtraction["actions"][0];
  selected: boolean;
  onToggle: () => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">{item.task}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {item.owner && <Badge variant="outline">{item.owner}</Badge>}
            {item.due_date && <Badge variant="outline">{item.due_date}</Badge>}
            {item.due_date_raw && <Badge variant="outline">{item.due_date_raw}</Badge>}
            {item.priority && (
              <Badge variant={item.priority === "P0" ? "destructive" : "secondary"}>
                {item.priority}
              </Badge>
            )}
            {item.status && <Badge variant="outline">{item.status}</Badge>}
            <Badge
              variant={
                item.confidence === "high"
                  ? "default"
                  : item.confidence === "medium"
                  ? "secondary"
                  : "outline"
              }
            >
              {item.confidence}
            </Badge>
          </div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showEvidence ? "Masquer" : "Voir"} preuve
          </button>
          {showEvidence && (
            <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">
              "{item.evidence}"
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

