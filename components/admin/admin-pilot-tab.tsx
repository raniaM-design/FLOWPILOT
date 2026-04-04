"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type WeeklyRow = { week: string; positive: number; negative: number };

type NegativeItem = {
  id: string;
  messageContent: string;
  comment: string | null;
  createdAt: string;
};

type PilotPayload = {
  sessionAverage30d: number | null;
  sessionCount30d: number;
  weeklyThumbs: WeeklyRow[];
  negativeLatest: NegativeItem[];
  systemPrompt: string;
};

export function AdminPilotTab() {
  const [data, setData] = useState<PilotPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bot-pilot");
      if (!res.ok) {
        throw new Error("Impossible de charger les données Pilot");
      }
      const json = (await res.json()) as PilotPayload;
      setData(json);
      setDraftPrompt(json.systemPrompt);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePrompt = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bot-pilot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: draftPrompt }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement");
      setPromptOpen(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-48 items-center justify-center text-indigo-600">
        Chargement Pilot…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const avg =
    data.sessionAverage30d != null
      ? data.sessionAverage30d.toFixed(2).replace(/\.?0+$/, "")
      : "—";

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-indigo-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a56db] text-white">
            <Bot className="h-5 w-5" />
          </span>
          Assistant Pilot — retours utilisateurs
        </h2>
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-indigo-300"
          onClick={() => {
            setDraftPrompt(data.systemPrompt);
            setPromptOpen(true);
          }}
        >
          <Sparkles className="h-4 w-4" />
          Améliorer le prompt
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">
            Score moyen des sessions (30 jours)
          </h3>
          <p className="mt-2 text-3xl font-bold text-indigo-900">
            {avg}
            <span className="text-lg font-normal text-slate-500"> / 5</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {data.sessionCount30d} notation
            {data.sessionCount30d > 1 ? "s" : ""} enregistrée
            {data.sessionCount30d > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-indigo-900">
          👍 / 👎 par semaine (8 dernières semaines)
        </h3>
        {data.weeklyThumbs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun retour sur cette période.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.weeklyThumbs}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="positive"
                  name="👍 Positif"
                  fill="#1a56db"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="negative"
                  name="👎 Négatif"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-indigo-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-indigo-900">
          10 derniers retours négatifs (message + commentaire)
        </h3>
        {data.negativeLatest.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun retour négatif.</p>
        ) : (
          <ul className="space-y-4">
            {data.negativeLatest.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm"
              >
                <p className="text-xs text-slate-500">
                  {new Date(row.createdAt).toLocaleString("fr-FR")}
                </p>
                <p className="mt-2 line-clamp-4 text-slate-800">
                  <span className="font-medium text-slate-600">Réponse : </span>
                  {row.messageContent}
                </p>
                {row.comment && (
                  <p className="mt-2 text-slate-700">
                    <span className="font-medium text-red-700">Commentaire : </span>
                    {row.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt système Pilot</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            className="min-h-[280px] font-mono text-sm"
            placeholder="Prompt système…"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPromptOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-[#1a56db] hover:bg-[#1648c8]"
              disabled={saving}
              onClick={() => void savePrompt()}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
