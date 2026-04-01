"use client";

import * as React from "react";
import { CHUNK_SIZE_MB_FOR_VERCEL, splitAudioIntoChunks } from "@/lib/audio-chunker";

type Decision = {
  id: string;
  texte: string;
  auteur: string;
  date_effet: string;
};

type Action = {
  id: string;
  texte: string;
  responsable: string;
  deadline: string;
  priorite: string;
};

type PointSurveillance = {
  id: string;
  texte: string;
  risque: string;
  proprietaire: string;
};

type AnalysisPayload = {
  decisions: Decision[];
  actions: Action[];
  points_surveillance: PointSurveillance[];
  resume_executif: string;
};

export function AudioUploader() {
  const [status, setStatus] = React.useState<string>("");
  const [progress, setProgress] = React.useState<number>(0);
  const [transcription, setTranscription] = React.useState<string>("");
  const [analysis, setAnalysis] = React.useState<AnalysisPayload | null>(null);
  const [inputDisabled, setInputDisabled] = React.useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setAnalysis(null);
    setTranscription("");
    setStatus("");
    setProgress(0);
    setInputDisabled(true);

    try {
      const chunks = splitAudioIntoChunks(file, CHUNK_SIZE_MB_FOR_VERCEL);
      const total = chunks.length;
      if (total === 0) {
        throw new Error("Aucun morceau à transcrire.");
      }

      const transcriptParts: string[] = [];

      for (let i = 0; i < total; i++) {
        setStatus(`Transcription chunk ${i + 1} / ${total}...`);

        const fd = new FormData();
        fd.append("chunk", chunks[i], `chunk-${i}.mp3`);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: fd,
        });

        const data = (await res.json()) as { text?: string; error?: string };

        if (!res.ok) {
          throw new Error(data.error || `Transcription échouée (HTTP ${res.status})`);
        }

        transcriptParts.push((data.text ?? "").trim());
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      const fullText = transcriptParts.join(" ").trim();
      if (!fullText) {
        throw new Error("Aucun texte transcrit — vérifiez le fichier audio.");
      }

      setTranscription(fullText);
      setProgress(100);
      setStatus("Analyse en cours...");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText }),
      });

      const analyzeData = (await analyzeRes.json()) as AnalysisPayload & {
        error?: string;
        raw?: string;
      };

      if (!analyzeRes.ok) {
        const detail =
          analyzeData.raw != null
            ? `${analyzeData.error ?? "Erreur"} (voir la réponse brute en console)`
            : analyzeData.error ?? `Analyse échouée (HTTP ${analyzeRes.status})`;
        if (analyzeData.raw != null) {
          console.error("[AudioUploader] analyze raw:", analyzeData.raw);
        }
        throw new Error(detail);
      }

      setAnalysis({
        decisions: Array.isArray(analyzeData.decisions) ? analyzeData.decisions : [],
        actions: Array.isArray(analyzeData.actions) ? analyzeData.actions : [],
        points_surveillance: Array.isArray(analyzeData.points_surveillance)
          ? analyzeData.points_surveillance
          : [],
        resume_executif: String(analyzeData.resume_executif ?? ""),
      });
      setStatus("Terminé.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setStatus(`❌ Erreur : ${msg}`);
      setProgress(0);
      setTranscription("");
      setAnalysis(null);
    } finally {
      setInputDisabled(false);
    }
  };

  const showProgressBar = progress > 0 && progress < 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <label htmlFor="audio-upload" className="mb-2 block text-sm font-medium text-slate-800">
          Importer un audio / vidéo
        </label>
        <input
          id="audio-upload"
          type="file"
          accept="audio/*,video/mp4,video/webm"
          disabled={inputDisabled}
          onChange={onFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {status && (
        <p className="text-sm font-medium text-slate-700" role="status">
          {status}
        </p>
      )}

      {showProgressBar && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">{progress} %</p>
        </div>
      )}

      {transcription ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <details className="group" open>
            <summary className="cursor-pointer list-none border-b border-slate-100 px-4 py-3 font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
              Transcription <span className="text-sm font-normal text-slate-500">(déplier / replier)</span>
            </summary>
            <div className="max-h-72 overflow-auto px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {transcription}
            </div>
          </details>
        </section>
      ) : null}

      {analysis ? (
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Analyse</h2>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Résumé exécutif
            </h3>
            <p className="text-slate-800 whitespace-pre-wrap">{analysis.resume_executif}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Décisions</h3>
            <ul className="space-y-3">
              {analysis.decisions.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-slate-900">{d.texte}</p>
                  <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Auteur</dt>
                      <dd>{d.auteur || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Date d&apos;effet</dt>
                      <dd>{d.date_effet || "—"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Actions</h3>
            <ul className="space-y-3">
              {analysis.actions.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-slate-900">{a.texte}</p>
                  <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Responsable</dt>
                      <dd>{a.responsable || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Échéance</dt>
                      <dd>{a.deadline || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Priorité</dt>
                      <dd className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-800">
                        {a.priorite || "—"}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Points de surveillance</h3>
            <ul className="space-y-3">
              {analysis.points_surveillance.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm"
                >
                  <p className="font-medium text-slate-900">{p.texte}</p>
                  <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Risque</dt>
                      <dd>{p.risque || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Propriétaire</dt>
                      <dd>{p.proprietaire || "—"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
