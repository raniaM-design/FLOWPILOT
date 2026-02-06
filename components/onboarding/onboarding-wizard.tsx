"use client";

import { useState, useEffect } from "react";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  X, 
  Rocket, 
  FolderPlus, 
  Calendar, 
  FileText, 
  ListTodo, 
  CheckSquare,
  Sparkles,
  Trophy,
  Star
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: React.ReactNode;
  completed: boolean;
  color: string;
  gradient: string;
}

interface OnboardingWizardProps {
  completedSteps: string[];
  userId: string;
}

export function OnboardingWizard({ completedSteps, userId }: OnboardingWizardProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [celebratingStep, setCelebratingStep] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [backgroundParticles, setBackgroundParticles] = useState<Array<{ id: number; left: number; top: number; delay: number; duration: number }>>([]);
  const [victoryParticles, setVictoryParticles] = useState<Array<{ id: number; left: number; top: number; delay: number; duration: number }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Générer les particules uniquement côté client pour éviter les erreurs d'hydratation
  useEffect(() => {
    setIsMounted(true);
    
    // Générer les particules de fond
    const bgParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setBackgroundParticles(bgParticles);

    // Générer les particules de victoire
    const vParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setVictoryParticles(vParticles);
  }, []);

  useEffect(() => {
    const allSteps: OnboardingStep[] = [
      {
        key: "create_project",
        title: "Créer votre premier projet",
        description: "Organisez votre travail en créant un projet. Vous pourrez y associer des réunions, décisions et actions.",
        actionLabel: "Créer un projet",
        actionHref: "/app/projects/new",
        icon: <FolderPlus className="h-6 w-6" />,
        completed: completedSteps.includes("create_project"),
        color: "blue",
        gradient: "from-blue-500 to-cyan-500",
      },
      {
        key: "create_meeting",
        title: "Créer une réunion",
        description: "Enregistrez une réunion et son compte-rendu. PILOTYS analysera automatiquement le contenu pour extraire les décisions et actions.",
        actionLabel: "Créer une réunion",
        actionHref: "/app/meetings/new",
        icon: <Calendar className="h-6 w-6" />,
        completed: completedSteps.includes("create_meeting"),
        color: "purple",
        gradient: "from-purple-500 to-pink-500",
      },
      {
        key: "analyze_meeting",
        title: "Analyser une réunion",
        description: "Une fois votre réunion créée, analysez-la pour extraire automatiquement les décisions et actions à suivre.",
        actionLabel: "Voir les réunions",
        actionHref: "/app/meetings",
        icon: <FileText className="h-6 w-6" />,
        completed: completedSteps.includes("analyze_meeting"),
        color: "indigo",
        gradient: "from-indigo-500 to-blue-500",
      },
      {
        key: "create_decisions",
        title: "Créer des décisions",
        description: "Transformez les décisions prises en réunion en décisions suivies. Ajoutez le contexte et l'impact pour mieux piloter.",
        actionLabel: "Voir les décisions",
        actionHref: "/app/decisions",
        icon: <CheckSquare className="h-6 w-6" />,
        completed: completedSteps.includes("create_decisions"),
        color: "emerald",
        gradient: "from-emerald-500 to-teal-500",
      },
      {
        key: "create_actions",
        title: "Créer des actions",
        description: "Créez des actions concrètes avec responsable et échéance. Suivez leur avancement via le Kanban.",
        actionLabel: "Voir les actions",
        actionHref: "/app/actions",
        icon: <ListTodo className="h-6 w-6" />,
        completed: completedSteps.includes("create_actions"),
        color: "orange",
        gradient: "from-orange-500 to-amber-500",
      },
      {
        key: "follow_calendar",
        title: "Suivre le calendrier",
        description: "Visualisez vos actions et décisions dans le calendrier pour mieux planifier votre travail.",
        actionLabel: "Voir le calendrier",
        actionHref: "/app/calendar",
        icon: <Calendar className="h-6 w-6" />,
        completed: completedSteps.includes("follow_calendar"),
        color: "rose",
        gradient: "from-rose-500 to-pink-500",
      },
    ];

    setSteps(allSteps);
  }, [completedSteps]);

  // Générer des particules pour l'animation de célébration
  const createCelebrationParticles = (stepIndex: number) => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (stepIndex % 2 === 0 ? -20 : 20),
      y: 50,
      delay: i * 50,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const handleDismiss = async () => {
    setIsDismissed(true);
    try {
      await fetch("/api/onboarding/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la fermeture de l'onboarding:", error);
    }
  };

  const handleStepComplete = async (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    setCelebratingStep(stepKey);
    createCelebrationParticles(stepIndex);
    
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepKey }),
      });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la complétion de l'étape:", error);
    }
    
    setTimeout(() => setCelebratingStep(null), 1000);
  };

  if (isDismissed) {
    return null;
  }

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  // Si toutes les étapes sont complétées, afficher un écran de victoire
  if (completedCount === totalSteps) {
    return (
      <FlowCard variant="default" className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 overflow-hidden relative">
        {/* Particules de fond - générées uniquement côté client */}
        {isMounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {victoryParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30 animate-pulse"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            ))}
          </div>
        )}

        <FlowCardContent className="p-8 relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-lg animate-bounce">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                🎉 Félicitations !
              </h2>
              <p className="text-lg text-slate-600">
                Vous avez complété toutes les étapes d'onboarding !
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-6 w-6 text-yellow-400 fill-yellow-400 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <Button
              onClick={handleDismiss}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              Commencer à utiliser PILOTYS
            </Button>
          </div>
        </FlowCardContent>
      </FlowCard>
    );
  }

  const nextStep = steps.find(s => !s.completed);
  const nextStepIndex = steps.findIndex(s => s.key === nextStep?.key);

  return (
    <FlowCard variant="default" className="border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/40 overflow-hidden relative shadow-xl">
      {/* Effet de particules animées en arrière-plan - générées uniquement côté client */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {backgroundParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20 animate-pulse"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <FlowCardContent className="p-6 lg:p-8 relative z-10">
        {/* Header avec animation */}
        <div className="flex items-start justify-between gap-4 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg animate-pulse">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              {nextStep && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bienvenue sur PILOTYS !
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Suivez ces étapes pour démarrer rapidement
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Barre de progression avec animation */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700 mb-3">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Progression
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {completedCount} / {totalSteps}
            </span>
          </div>
          <div className="relative w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Effet de brillance animé */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
            {/* Particules de progression */}
            {completedCount > 0 && (
              <div className="absolute inset-0">
                {Array.from({ length: completedCount }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-1 h-full bg-white rounded-full opacity-50 animate-pulse"
                    style={{ left: `${(i + 1) * (100 / totalSteps)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Liste des étapes avec animations */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isNext = nextStep && step.key === nextStep.key;
            const isCelebrating = celebratingStep === step.key;

            return (
              <div
                key={step.key}
                className={`relative group transition-all duration-300 ${
                  isCompleted
                    ? "opacity-75 scale-[0.98]"
                    : isNext
                    ? "scale-105 z-10 ring-4 ring-blue-200/50 animate-pulse"
                    : "opacity-60"
                }`}
              >
                {/* Particules de célébration */}
                {isCelebrating && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {particles.map((particle) => (
                      <div
                        key={particle.id}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                          left: `${particle.x}%`,
                          top: `${particle.y}%`,
                          animation: `confetti 1s ease-out ${particle.delay}ms forwards`,
                        }}
                      />
                    ))}
                  </div>
                )}

            <div
              className={`relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-300 ${
                isCompleted
                  ? step.gradient === "from-blue-500 to-cyan-500"
                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-300 shadow-lg"
                    : step.gradient === "from-purple-500 to-pink-500"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 border-purple-300 shadow-lg"
                    : step.gradient === "from-indigo-500 to-blue-500"
                    ? "bg-gradient-to-br from-indigo-500 to-blue-500 border-indigo-300 shadow-lg"
                    : step.gradient === "from-emerald-500 to-teal-500"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-300 shadow-lg"
                    : step.gradient === "from-orange-500 to-amber-500"
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 border-orange-300 shadow-lg"
                    : "bg-gradient-to-br from-rose-500 to-pink-500 border-rose-300 shadow-lg"
                  : isNext
                  ? "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300 shadow-xl ring-4 ring-blue-200/50"
                  : "bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
                  {/* Icône avec animation */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        isCompleted
                          ? `bg-white/20 text-white`
                          : isNext
                          ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg animate-pulse"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {step.icon}
                    </div>
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg animate-bounce">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {isNext && !isCompleted && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-bold text-lg transition-colors ${
                              isCompleted
                                ? "text-white"
                                : isNext
                                ? "text-slate-900"
                                : "text-slate-700"
                            }`}
                          >
                            {step.title}
                          </h3>
                          {isCompleted && (
                            <span className="text-xs font-semibold text-white/90 bg-white/20 px-2 py-1 rounded-full">
                              ✓ Complété
                            </span>
                          )}
                          {isNext && !isCompleted && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full animate-pulse">
                              Prochaine étape
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm mb-4 transition-colors ${
                            isCompleted
                              ? "text-white/90"
                              : isNext
                              ? "text-slate-600"
                              : "text-slate-500"
                          }`}
                        >
                          {step.description}
                        </p>
                        {!isCompleted && (
                          <Link href={step.actionHref}>
                            <Button
                              size="sm"
                              className={`w-full sm:w-auto transition-all duration-300 ${
                                isNext
                                  ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                              onClick={() => handleStepComplete(step.key)}
                            >
                              {step.actionLabel}
                              <ArrowRight className={`h-4 w-4 ml-2 transition-transform ${isNext ? "group-hover:translate-x-1" : ""}`} />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message d'encouragement */}
        {completedCount > 0 && completedCount < totalSteps && (
          <div className="mt-6 pt-6 border-t border-slate-200/60">
            <p className="text-sm text-center text-slate-600">
              <span className="font-semibold text-blue-600">
                {completedCount} étape{completedCount > 1 ? "s" : ""} complétée{completedCount > 1 ? "s" : ""} !
              </span>{" "}
              Continuez pour découvrir toutes les fonctionnalités de PILOTYS 🚀
            </p>
          </div>
        )}
      </FlowCardContent>
    </FlowCard>
  );
}
