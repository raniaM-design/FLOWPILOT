"use client";

import { useState, useEffect, useTransition } from "react";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle, FlowCardDescription } from "@/components/ui/flow-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getUserPreferences } from "@/lib/user-preferences";
import { Eye, Zap, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function PreferencesPage() {
  const [focusMode, setFocusMode] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();

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

