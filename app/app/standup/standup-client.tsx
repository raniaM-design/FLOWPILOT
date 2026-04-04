"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markStandupActionDone,
  recordStandupComplete,
} from "@/app/app/standup-actions";
import type { StandupAttentionDecision, StandupPriorityRow } from "@/lib/standup/load-standup-data";

type Props = {
  firstName: string;
  dateLabel: string;
  priorities: StandupPriorityRow[];
  attention: StandupAttentionDecision | null;
};

export function StandupClient({
  firstName,
  dateLabel,
  priorities,
  attention,
}: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isFinishing, startFinish] = useTransition();

  const visiblePriorities = priorities.filter((p) => !hiddenIds.has(p.id));

  const handleDone = (actionId: string) => {
    setPendingId(actionId);
    markStandupActionDone(actionId)
      .then(() => {
        setHiddenIds((prev) => new Set(prev).add(actionId));
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => setPendingId(null));
  };

  const handleFinish = () => {
    startFinish(async () => {
      await recordStandupComplete();
      router.push("/app");
    });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-10 sm:gap-12">
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <header className="space-y-2">
          <p className="text-sky-300/90 text-sm font-medium uppercase tracking-widest">
            Standup
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Bonjour {firstName || "toi"}
            <span className="text-slate-400 font-normal"> — voici ta journée</span>
          </h1>
          <p className="text-lg text-slate-400 capitalize">{dateLabel}</p>
        </header>

        <section className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            Tes 3 priorités aujourd&apos;hui
          </h2>
          {visiblePriorities.length === 0 ? (
            <p className="text-slate-400 text-lg">
              Aucune action échéance aujourd&apos;hui ni en retard. Profite-en pour avancer sur le long terme.
            </p>
          ) : (
            <ul className="space-y-4">
              {visiblePriorities.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/90">
                      {p.overdue ? "En retard" : "Aujourd’hui"}
                      {p.projectName ? ` · ${p.projectName}` : ""}
                    </p>
                    <p className="text-xl sm:text-2xl font-semibold text-white leading-snug">
                      {p.title}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleDone(p.id)}
                    disabled={pendingId === p.id}
                    className="shrink-0 h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base"
                  >
                    {pendingId === p.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Fait ✓
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            1 point d&apos;attention
          </h2>
          {attention ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase text-amber-200/90 mb-2">
                Décision sans action liée
                {attention.projectName ? ` · ${attention.projectName}` : ""}
              </p>
              <p className="text-lg sm:text-xl font-medium text-white mb-4">
                {attention.title}
              </p>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href={`/app/decisions/${attention.id}`}>
                  Ouvrir la décision
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-slate-400 text-lg">
              Rien à signaler : toutes tes décisions récentes ont au moins une action, ou tu n’en as pas en attente.
            </p>
          )}
        </section>

        <div className="mt-auto pt-6">
          <Button
            type="button"
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/30"
          >
            {isFinishing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                C&apos;est parti →
                <ArrowRight className="ml-2 h-5 w-5 opacity-90" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
