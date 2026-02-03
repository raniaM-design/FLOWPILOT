"use client";

import Link from "next/link";
import { Lock, Users, Building2, CheckCircle2, ArrowRight, Columns3, Calendar, FileText, CheckSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamSpaceLocked() {
  // Mini preview du board (cartes grisées)
  const boardColumns = [
    { id: "todo", label: "À faire", color: "slate" },
    { id: "doing", label: "En cours", color: "blue" },
    { id: "review", label: "En revue", color: "amber" },
    { id: "done", label: "Terminé", color: "emerald" },
  ];

  const benefits = [
    { icon: Users, label: "Membres & rôles" },
    { icon: Building2, label: "Projets partagés" },
    { icon: CheckSquare2, label: "Assignations & suivi" },
  ];

  return (
    <FlowCard className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 border-slate-200/60 relative overflow-hidden">
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Collaboration d'équipe (Plan Entreprise)
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Invitez votre équipe, partagez projets et réunions, et suivez décisions & actions ensemble.
          </p>
          <Link href="/pricing">
            <Button size="lg" className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white">
              Passer au plan Entreprise
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <FlowCardContent className="p-6 md:p-8 opacity-40">
        {/* Header (preview) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Tabs (preview) */}
        <Tabs defaultValue="board" className="w-full pointer-events-none">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Réunions</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Décisions</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckSquare2 className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* Board Preview */}
          <TabsContent value="board" className="mt-0">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {boardColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-64 bg-slate-50/50 rounded-xl border border-slate-200/60 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-6 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 p-3">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Benefits */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200/60 mt-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Badge
                key={index}
                variant="secondary"
                className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium px-3 py-1.5"
              >
                <Icon className="h-3 w-3 mr-1.5 text-slate-500" />
                {benefit.label}
              </Badge>
            );
          })}
        </div>
      </FlowCardContent>
    </FlowCard>
  );
}

