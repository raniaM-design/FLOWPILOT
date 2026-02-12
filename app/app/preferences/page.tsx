"use client";

import { useState, useEffect, useTransition } from "react";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle, FlowCardDescription } from "@/components/ui/flow-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUserPreferences } from "@/lib/user-preferences";
import { Eye, Zap, CheckCircle2, Target, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DEFAULT_CRITICAL_DAYS, DEFAULT_MONITOR_DAYS } from "@/lib/decisions/decision-thresholds";

export default function PreferencesPage() {
  const [focusMode, setFocusMode] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [criticalDays, setCriticalDays] = useState(DEFAULT_CRITICAL_DAYS);
  const [monitorDays, setMonitorDays] = useState(DEFAULT_MONITOR_DAYS);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [thresholdsPending, setThresholdsPending] = useState(false);

  useEffect(() => {
    // Charger les préférences au montage depuis les cookies
    const prefs = getUserPreferences();
    setFocusMode(prefs.focusMode);
    setReduceMotion(prefs.reduceMotion);
    setIsLoading(false);

    // Appliquer reduceMotion immédiatement si activé
    if (prefs.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    }
  }, []);

  useEffect(() => {
    fetch("/api/user/preferences/decision-thresholds")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setCriticalDays(data.criticalDays ?? DEFAULT_CRITICAL_DAYS);
          setMonitorDays(data.monitorDays ?? DEFAULT_MONITOR_DAYS);
        }
      })
      .catch(() => {});
  }, []);

  const saveDecisionThresholds = async () => {
    const crit = Math.max(0, Math.min(365, criticalDays));
    const mon = Math.max(0, Math.min(365, Math.max(monitorDays, crit)));
    setCriticalDays(crit);
    setMonitorDays(mon);

    setThresholdsPending(true);
    try {
      const res = await fetch("/api/user/preferences/decision-thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criticalDays: crit, monitorDays: mon }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setThresholdsPending(false);
    }
  };

  const resetThresholds = () => {
    setCriticalDays(DEFAULT_CRITICAL_DAYS);
    setMonitorDays(DEFAULT_MONITOR_DAYS);
  };

  const savePreferences = async (newFocusMode: boolean, newReduceMotion: boolean, previousFocusMode: boolean, previousReduceMotion: boolean) => {
    try {
      const response = await fetch("/app/preferences/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          focusMode: newFocusMode,
          reduceMotion: newReduceMotion,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      // Afficher le toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences:", error);
      // Revenir aux valeurs précédentes en cas d'erreur
      setFocusMode(previousFocusMode);
      setReduceMotion(previousReduceMotion);
      
      // Restaurer la classe CSS si nécessaire
      if (previousReduceMotion) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    }
  };

  const handleFocusModeChange = (checked: boolean) => {
    const previousFocusMode = focusMode;
    const previousReduceMotion = reduceMotion;
    
    // Mise à jour optimiste
    setFocusMode(checked);
    
    startTransition(async () => {
      await savePreferences(checked, reduceMotion, previousFocusMode, previousReduceMotion);
    });
  };

  const handleReduceMotionChange = (checked: boolean) => {
    const previousFocusMode = focusMode;
    const previousReduceMotion = reduceMotion;
    
    // Mise à jour optimiste
    setReduceMotion(checked);
    
    // Appliquer immédiatement la classe CSS
    if (checked) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
    
    startTransition(async () => {
      await savePreferences(focusMode, checked, previousFocusMode, previousReduceMotion);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Préférences"
        subtitle="Personnalise ton expérience FlowPilot selon tes besoins"
      />

      {/* Focus Mode */}
      <FlowCard variant="default">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <FlowCardTitle>Mode Focus</FlowCardTitle>
              <FlowCardDescription>
                Affiche uniquement les éléments prioritaires pour réduire les distractions
              </FlowCardDescription>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="focus-mode" className="text-base font-medium cursor-pointer">
                Activer le mode focus
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Le dashboard affichera uniquement les éléments nécessitant ton attention immédiate
              </p>
            </div>
            <Switch
              id="focus-mode"
              checked={focusMode}
              onCheckedChange={handleFocusModeChange}
              disabled={isLoading || isPending}
            />
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Seuils des décisions */}
      <FlowCard variant="default">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <FlowCardTitle>Seuils des états de décision</FlowCardTitle>
              <FlowCardDescription>
                Personnalise quand une décision est « Critique » ou « À surveiller » selon la proximité de l&apos;échéance
              </FlowCardDescription>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="critical-days">Critique (en jours)</Label>
              <Input
                id="critical-days"
                type="number"
                min={0}
                max={365}
                value={criticalDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setCriticalDays(isNaN(v) ? 0 : Math.max(0, Math.min(365, v)));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Échéance dans moins de X jours → badge rouge
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monitor-days">À surveiller (en jours)</Label>
              <Input
                id="monitor-days"
                type="number"
                min={0}
                max={365}
                value={monitorDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setMonitorDays(isNaN(v) ? 0 : Math.max(0, Math.min(365, v)));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Échéance entre Critique et À surveiller → badge ambre
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveDecisionThresholds}
              disabled={thresholdsPending || monitorDays < criticalDays}
            >
              Enregistrer
            </Button>
            <Button variant="outline" onClick={resetThresholds} disabled={thresholdsPending}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Valeurs par défaut ({DEFAULT_CRITICAL_DAYS} j / {DEFAULT_MONITOR_DAYS} j)
            </Button>
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Reduce Motion */}
      <FlowCard variant="default">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <FlowCardTitle>Réduire les animations</FlowCardTitle>
              <FlowCardDescription>
                Désactive les animations et transitions pour une expérience plus calme
              </FlowCardDescription>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="reduce-motion" className="text-base font-medium cursor-pointer">
                Réduire les mouvements
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Toutes les animations et transitions seront désactivées ou réduites
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={handleReduceMotionChange}
              disabled={isLoading || isPending}
            />
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Toast de confirmation */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Préférences sauvegardées</span>
          </div>
        </div>
      )}
    </div>
  );
}

