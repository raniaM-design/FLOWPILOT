"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import { isCelebrationEnabled } from "@/lib/celebration-settings";
import { isReduceMotionEnabled } from "@/lib/user-preferences";

interface CelebrationFeedbackProps {
  message: string;
  nextStep?: string;
  onClose: () => void;
}

export function CelebrationFeedback({
  message,
  nextStep,
  onClose,
}: CelebrationFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isCelebrationEnabled()) {
      // Si désactivé, fermer immédiatement
      setIsVisible(false);
      setTimeout(onClose, 0);
      return;
    }

    // Vérifier reduceMotion : si activé, pas d'animation confetti
    const reduceMotion = isReduceMotionEnabled();

    let interval: NodeJS.Timeout | null = null;

    if (!reduceMotion) {
      // Animation confetti légère et discrète
      const duration = 1000; // Réduit à 1 seconde
      const animationEnd = Date.now() + duration;

      interval = setInterval(() => {
        if (Date.now() > animationEnd) {
          if (interval) clearInterval(interval);
          return;
        }

        // Confetti très léger depuis le haut
        confetti({
          particleCount: 2, // Réduit de 3 à 2
          angle: 60,
          spread: 45, // Réduit de 55 à 45
          origin: { x: 0 },
          colors: ["#22c55e", "#3b82f6"], // Moins de couleurs
          gravity: 0.8, // Plus rapide
        });

        // Confetti depuis le haut à droite
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 45,
          origin: { x: 1 },
          colors: ["#22c55e", "#3b82f6"],
          gravity: 0.8,
        });
      }, 300); // Intervalle augmenté de 200ms à 300ms
    }

    // Auto-fermeture après 3 secondes (réduit de 4)
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      clearTimeout(timer);
    };
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <Card className="pointer-events-auto shadow-2xl border-2 border-primary animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1">{message}</h3>
              {nextStep && (
                <p className="text-sm text-muted-foreground">
                  Prochaine étape : {nextStep}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

