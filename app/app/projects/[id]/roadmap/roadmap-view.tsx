"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, AlertTriangle, CheckCircle2, Ban, AlertCircle, ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { DecisionRiskBadge } from "@/components/decision-risk-badge";
import { DecisionRisk } from "@/lib/decision-risk";
import { DecisionUrgencyBar } from "@/components/decision-urgency-bar";
import { PrintButton } from "@/components/print-button";

type DecisionMetrics = {
  id: string;
  title: string;
  status: string;
  createdAt: string; // Serialized as string from server
  nextDueDate: string | null; // Serialized as string from server
  totalActions: number;
  openActions: number;
  doneActions: number;
  blockedActions: number;
  overdueCount: number;
  doingCount: number;
  isExecutable: boolean;
  riskLevel: DecisionRisk;
  nextStep: string;
};

interface RoadmapViewProps {
  projectId: string;
  projectName: string;
  thisWeek: DecisionMetrics[];
  nextWeek: DecisionMetrics[];
  upcoming: DecisionMetrics[];
  noDueDate: DecisionMetrics[];
  actionsByDecisionId: Map<string, Array<{ id: string; status: string; dueDate: Date | null }>>;
}

export function RoadmapView({
  projectId,
  projectName,
  thisWeek,
  nextWeek,
  upcoming,
  noDueDate,
  actionsByDecisionId,
}: RoadmapViewProps) {
  const [viewMode, setViewMode] = useState<"normal" | "meeting">("normal");

  // Helper pour format date
  const formatDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(d);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Aujourd'hui";
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Demain";
    }
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const getDecisionStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary" as const;
      case "DECIDED":
        return "default" as const;
      case "ARCHIVED":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const getDecisionStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Brouillon";
      case "DECIDED":
        return "Décidée";
      case "ARCHIVED":
        return "Archivée";
      default:
        return status;
    }
  };

  // Copier le résumé en mode réunion
  const copySummary = () => {
    const allDecisions = [...thisWeek, ...nextWeek, ...upcoming, ...noDueDate];
    const lines = [
      `Roadmap — ${projectName}`,
      "",
      ...allDecisions.map((d) => {
        const dueDateStr = d.nextDueDate ? formatDate(d.nextDueDate) : "Aucune échéance";
        return `- ${d.title} — Risque: ${d.riskLevel.label} — Next: ${d.nextStep} — Échéance: ${dueDateStr}`;
      }),
    ];
    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
  };

  const renderDecisionCard = (decision: DecisionMetrics, compact: boolean = false) => {
    if (compact) {
      return (
        <Link key={decision.id} href={`/app/decisions/${decision.id}`}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm line-clamp-1">{decision.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={getDecisionStatusBadgeVariant(decision.status)} className="text-xs">
                    {getDecisionStatusLabel(decision.status)}
                  </Badge>
                  <DecisionRiskBadge risk={decision.riskLevel} />
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {decision.nextDueDate ? `Prochaine échéance : ${formatDate(decision.nextDueDate)}` : "Aucune échéance"}
                  </span>
                </div>
                <div className="text-xs font-medium text-foreground">
                  Prochaine étape : {decision.nextStep}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    }

    return (
      <Link key={decision.id} href={`/app/decisions/${decision.id}`}>
        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{decision.title}</CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={getDecisionStatusBadgeVariant(decision.status)} className="text-xs">
                  {getDecisionStatusLabel(decision.status)}
                </Badge>
                <DecisionRiskBadge risk={decision.riskLevel} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <DecisionUrgencyBar 
              actions={actionsByDecisionId.get(decision.id) || []}
            />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {decision.nextDueDate ? `Prochaine échéance : ${formatDate(decision.nextDueDate)}` : "Aucune échéance"}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                {decision.openActions} Ouverte{decision.openActions > 1 ? "s" : ""}
              </Badge>
              {decision.doneActions > 0 && (
                <Badge variant="outline">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {decision.doneActions} Terminée{decision.doneActions > 1 ? "s" : ""}
                </Badge>
              )}
              {decision.blockedActions > 0 && (
                <Badge variant="outline">
                  <Ban className="mr-1 h-3 w-3" />
                  {decision.blockedActions} Bloquée{decision.blockedActions > 1 ? "s" : ""}
                </Badge>
              )}
              {decision.overdueCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {decision.overdueCount} En retard
                </Badge>
              )}
            </div>

            <div className="text-sm">
              <span className="font-medium">Prochaine étape : </span>
              <span className="text-muted-foreground">{decision.nextStep}</span>
            </div>

            {!decision.isExecutable && (
              <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Décision enregistrée mais non exécutable
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  const renderSection = (title: string, decisions: DecisionMetrics[], compact: boolean = false) => {
    if (decisions.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          {decisions.map((decision) => renderDecisionCard(decision, compact))}
        </div>
      </div>
    );
  };

  const isCompact = viewMode === "meeting";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href={`/app/projects/${projectId}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au projet
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Roadmap</h1>
          <p className="text-muted-foreground mt-2">
            Vue chronologique des décisions et de leur exécution.
          </p>
        </div>
      </div>

      {/* Toggle Normal / Réunion */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "normal" | "meeting")}>
          <TabsList>
            <TabsTrigger value="normal">Normal</TabsTrigger>
            <TabsTrigger value="meeting">Réunion</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          {isCompact && (
            <Button variant="outline" size="sm" onClick={copySummary}>
              <Copy className="mr-2 h-4 w-4" />
              Copier le résumé
            </Button>
          )}
          <PrintButton href={`/app/projects/${projectId}/roadmap/print`} />
        </div>
      </div>

      {/* Sections groupées */}
      <div className="space-y-8">
        {renderSection("Cette semaine", thisWeek, isCompact)}
        {renderSection("Semaine prochaine", nextWeek, isCompact)}
        {renderSection("À venir", upcoming, isCompact)}
        {renderSection("Sans échéance", noDueDate, isCompact)}
        
        {thisWeek.length === 0 && nextWeek.length === 0 && upcoming.length === 0 && noDueDate.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune décision dans ce projet pour le moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

