"use client";

import { useState, useTransition } from "react";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle, FlowCardDescription } from "@/components/ui/flow-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/ui/page-header";
import { CheckCircle2, Zap, Layout, Gauge } from "lucide-react";
import { useDisplayPreferences } from "@/contexts/display-preferences-context";

export default function DisplayPreferencesPage() {
  const { preferences, isLoading, updatePreferences } = useDisplayPreferences();
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReduceAnimationsChange = (checked: boolean) => {
    startTransition(async () => {
      try {
        await updatePreferences({ reduceAnimations: checked });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
        // L'erreur est déjà gérée dans le context (rollback automatique)
      }
    });
  };

  const handleDisplayModeChange = (value: string) => {
    startTransition(async () => {
      try {
        await updatePreferences({ displayMode: value as "standard" | "simplified" });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
        // L'erreur est déjà gérée dans le context
      }
    });
  };

  const handleDensityChange = (value: string) => {
    startTransition(async () => {
      try {
        await updatePreferences({ density: value as "comfort" | "standard" | "compact" });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
        // L'erreur est déjà gérée dans le context
      }
    });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Préférences d'affichage"
        subtitle="Personnalisez l'apparence de PILOTYS pour améliorer votre confort visuel et votre concentration."
      />

      {/* Section 1: Animations */}
      <FlowCard variant="default">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <FlowCardTitle>Animations et transitions</FlowCardTitle>
              <FlowCardDescription>
                Contrôlez les animations et effets visuels pour réduire la distraction.
              </FlowCardDescription>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="reduce-animations" className="text-base font-medium cursor-pointer">
                Réduire les animations
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Les animations essentielles (chargement, validation) restent actives.
              </p>
            </div>
            <Switch
              id="reduce-animations"
              checked={preferences.reduceAnimations}
              onCheckedChange={handleReduceAnimationsChange}
              disabled={isLoading || isPending}
            />
          </div>
        </FlowCardContent>
      </FlowCard>

      {/* Section 2: Mode d'affichage */}
      <FlowCard variant="default">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Layout className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <FlowCardTitle>Mode d'affichage</FlowCardTitle>
              <FlowCardDescription>
                Choisissez un style d'interface adapté à votre préférence.
              </FlowCardDescription>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent>
          <RadioGroup
            value={preferences.displayMode}
            onValueChange={handleDisplayModeChange}
            disabled={isLoading || isPending}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="standard" id="mode-standard" />
              <Label htmlFor="mode-standard" className="flex-1 cursor-pointer">
                <div className="font-medium">Standard</div>
                <div className="text-sm text-muted-foreground">
                  Interface complète avec tous les éléments
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="simplified" id="mode-simplified" />
              <Label htmlFor="mode-simplified" className="flex-1 cursor-pointer">
                <div className="font-medium">Simplifié</div>
                <div className="text-sm text-muted-foreground">
                  Réduit les éléments décoratifs pour une meilleure concentration
                </div>
              </Label>
            </div>
          </RadioGroup>
        </FlowCardContent>
      </FlowCard>

      {/* Section 3: Densité */}
      <FlowCard variant="default">
        <FlowCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Gauge className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <FlowCardTitle>Densité d'affichage</FlowCardTitle>
              <FlowCardDescription>
                Ajustez l'espacement pour améliorer la lisibilité.
              </FlowCardDescription>
            </div>
          </div>
        </FlowCardHeader>
        <FlowCardContent>
          <RadioGroup
            value={preferences.density}
            onValueChange={handleDensityChange}
            disabled={isLoading || isPending}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="comfort" id="density-comfort" />
              <Label htmlFor="density-comfort" className="flex-1 cursor-pointer">
                <div className="font-medium">Confort</div>
                <div className="text-sm text-muted-foreground">
                  Espacements plus larges pour une lecture prolongée
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="standard" id="density-standard" />
              <Label htmlFor="density-standard" className="flex-1 cursor-pointer">
                <div className="font-medium">Standard</div>
                <div className="text-sm text-muted-foreground">
                  Équilibre entre lisibilité et quantité d'informations
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="compact" id="density-compact" />
              <Label htmlFor="density-compact" className="flex-1 cursor-pointer">
                <div className="font-medium">Compact</div>
                <div className="text-sm text-muted-foreground">
                  Plus d'informations visibles sans scroll
                </div>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-4">
            La densité n'affecte pas la taille du texte, uniquement les espacements.
          </p>
        </FlowCardContent>
      </FlowCard>

      {/* Toast de confirmation */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Préférences enregistrées avec succès</span>
          </div>
        </div>
      )}
    </div>
  );
}

