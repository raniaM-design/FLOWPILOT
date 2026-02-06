"use client";

import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // Selector CSS de l'élément à mettre en évidence
  position: "top" | "bottom" | "left" | "right" | "center";
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface VisualOnboardingProps {
  userId: string;
  completedSteps: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "dashboard-overview",
    title: "Bienvenue sur PILOTYS",
    description: "Voici votre tableau de bord. Vous y trouverez toutes les informations importantes : actions prioritaires, décisions à surveiller, et statistiques de vos projets.",
    target: "[data-onboarding='dashboard']",
    position: "center",
  },
  {
    id: "create-menu",
    title: "Menu de création",
    description: "Créez rapidement des projets ou des décisions depuis ce menu déroulant. Les réunions et actions se créent depuis les projets.",
    target: "[data-onboarding='create-menu']",
    position: "bottom",
    action: {
      label: "Voir le menu",
      onClick: () => {
        const menu = document.querySelector("[data-onboarding='create-menu']") as HTMLElement;
        if (menu) menu.click();
      },
    },
  },
  {
    id: "projects-section",
    title: "Gestion des projets",
    description: "Organisez votre travail en projets. Chaque projet contient un Kanban pour visualiser vos actions, ainsi que des réunions et décisions associées.",
    target: "[data-onboarding='projects-link']",
    position: "right",
    action: {
      label: "Voir les projets",
      href: "/app/projects",
    },
  },
  {
    id: "decisions-section",
    title: "Suivi des décisions",
    description: "Suivez toutes vos décisions prises en réunion. Ajoutez le contexte, l'impact et associez des actions pour assurer leur suivi.",
    target: "[data-onboarding='decisions-link']",
    position: "right",
    action: {
      label: "Voir les décisions",
      href: "/app/decisions",
    },
  },
  {
    id: "actions-section",
    title: "Gestion des actions",
    description: "Pilotez vos actions avec des responsables, échéances et statuts. Les actions sont créées depuis les projets et visualisées dans le Kanban de chaque projet.",
    target: "[data-onboarding='actions-link']",
    position: "right",
    action: {
      label: "Voir les actions",
      href: "/app/actions",
    },
  },
  {
    id: "integrations-section",
    title: "Intégration Outlook",
    description: "Connectez votre compte Outlook pour importer automatiquement vos réunions et leurs participants dans PILOTYS.",
    target: "[data-onboarding='integrations-link']",
    position: "right",
    action: {
      label: "Voir les intégrations",
      href: "/app/integrations/outlook",
    },
  },
  {
    id: "meetings-section",
    title: "Réunions et comptes-rendus",
    description: "Enregistrez vos réunions et leurs comptes-rendus. Analysez-les pour extraire les décisions et actions à suivre.",
    target: "[data-onboarding='meetings-link']",
    position: "right",
    action: {
      label: "Voir les réunions",
      href: "/app/meetings",
    },
  },
  {
    id: "review-section",
    title: "Review mensuelle et hebdomadaire",
    description: "Générez des reviews structurées pour faire le point sur vos projets, décisions et actions. Exportez-les en PDF ou PowerPoint pour vos équipes.",
    target: "[data-onboarding='review-link']",
    position: "right",
    action: {
      label: "Voir les reviews",
      href: "/app/review",
    },
  },
  {
    id: "calendar-section",
    title: "Calendrier",
    description: "Visualisez vos actions et décisions dans le calendrier pour mieux planifier votre travail et respecter les échéances.",
    target: "[data-onboarding='calendar-link']",
    position: "right",
    action: {
      label: "Voir le calendrier",
      href: "/app/calendar",
    },
  },
  {
    id: "company-section",
    title: "Collaboration",
    description: "Travaillez en équipe. Créez une entreprise, invitez vos collègues et taggez-les sur les projets, décisions et actions pour les tenir informés.",
    target: "[data-onboarding='company-link']",
    position: "right",
    action: {
      label: "Voir l'entreprise",
      href: "/app/company",
    },
  },
];

export function VisualOnboarding({ userId, completedSteps }: VisualOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Vérifier si l'onboarding doit être affiché (nouvel utilisateur et pas encore complété)
    // On affiche l'onboarding visuel seulement si aucune étape n'est complétée
    // Si toutes les étapes sont complétées (6 étapes), ne plus afficher l'onboarding
    const shouldShow = completedSteps.length === 0;
    
    if (shouldShow) {
      // Attendre que le DOM soit prêt et que tous les éléments soient chargés
      const timer = setTimeout(() => {
        setIsVisible(true);
        startTour();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [completedSteps]);

  const startTour = () => {
    if (ONBOARDING_STEPS.length === 0) return;
    setCurrentStep(0);
    highlightStep(0);
  };

  const highlightStep = (stepIndex: number) => {
    const step = ONBOARDING_STEPS[stepIndex];
    if (!step) {
      completeOnboarding();
      return;
    }

    // Attendre un peu pour s'assurer que le DOM est prêt
    setTimeout(() => {
      // Si on cible le lien "actions-link", ouvrir d'abord le menu "Décisions"
      if (step.target === "[data-onboarding='actions-link']") {
        // Chercher directement le lien Actions pour voir s'il est visible
        let actionsLink = document.querySelector('[data-onboarding="actions-link"]') as HTMLElement;
        
        // Si le lien n'est pas visible, ouvrir le menu Décisions
        if (!actionsLink || actionsLink.offsetParent === null) {
          // Trouver le div qui toggle le menu Décisions (celui avec onClick)
          // Il est dans le même conteneur que le lien "decisions-link"
          const decisionsLink = document.querySelector('[data-onboarding="decisions-link"]');
          if (decisionsLink) {
            // Le toggle est le parent du Link qui contient le onClick
            const decisionsToggle = decisionsLink.closest('div')?.parentElement?.querySelector('div[onclick]') as HTMLElement;
            if (decisionsToggle) {
              // Vérifier si le menu est déjà ouvert
              const childrenContainer = decisionsToggle.parentElement?.querySelector('.ml-4');
              const isOpen = childrenContainer !== null && childrenContainer !== undefined && childrenContainer.children.length > 0;
              
              if (!isOpen) {
                // Cliquer pour ouvrir le menu
                decisionsToggle.click();
                // Attendre que le menu s'ouvre et que le lien soit visible
                setTimeout(() => {
                  // Vérifier à nouveau que le lien est maintenant visible
                  actionsLink = document.querySelector('[data-onboarding="actions-link"]') as HTMLElement;
                  if (actionsLink && actionsLink.offsetParent !== null) {
                    highlightElement(step, stepIndex);
                  } else {
                    // Si toujours pas visible, réessayer ou passer à l'étape suivante
                    if (stepIndex < ONBOARDING_STEPS.length - 1) {
                      highlightStep(stepIndex + 1);
                    } else {
                      completeOnboarding();
                    }
                  }
                }, 600);
                return;
              }
            }
          }
        }
        
        // Si le lien est déjà visible, continuer normalement
        if (actionsLink && actionsLink.offsetParent !== null) {
          highlightElement(step, stepIndex);
        } else {
          // Si le lien n'est toujours pas trouvé, passer à l'étape suivante
          if (stepIndex < ONBOARDING_STEPS.length - 1) {
            highlightStep(stepIndex + 1);
          } else {
            completeOnboarding();
          }
        }
      } else {
        highlightElement(step, stepIndex);
      }
    }, 100);
  };

  const highlightElement = (step: OnboardingStep, stepIndex: number) => {
    const element = document.querySelector(step.target) as HTMLElement;
    if (!element) {
      // Si l'élément n'existe pas, passer à l'étape suivante
      if (stepIndex < ONBOARDING_STEPS.length - 1) {
        highlightStep(stepIndex + 1);
      } else {
        completeOnboarding();
      }
      return;
    }

    setHighlightedElement(element);
    const rect = element.getBoundingClientRect();
    setHighlightRect(rect);
    
    // Ajouter un effet de pulsation à l'élément
    element.style.transition = "all 0.3s ease";
    element.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.5)";
    element.style.zIndex = "10000";
    element.style.position = "relative";
    
    // Scroll vers l'élément si nécessaire
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    
    // Calculer la position du tooltip
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const spacing = 20;
    
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (step.position) {
      case "top":
        tooltipTop = rect.top - tooltipHeight - spacing;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        tooltipTop = rect.bottom + spacing;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.left - tooltipWidth - spacing;
        break;
      case "right":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.right + spacing;
        break;
      case "center":
        tooltipTop = window.innerHeight / 2 - tooltipHeight / 2;
        tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Ajuster si le tooltip sort de l'écran
    if (tooltipLeft < 20) tooltipLeft = 20;
    if (tooltipLeft + tooltipWidth > window.innerWidth - 20) {
      tooltipLeft = window.innerWidth - tooltipWidth - 20;
    }
    if (tooltipTop < 20) tooltipTop = 20;
    if (tooltipTop + tooltipHeight > window.innerHeight - 20) {
      tooltipTop = window.innerHeight - tooltipHeight - 20;
    }

    setTooltipStyle({
      position: "fixed",
      top: `${tooltipTop}px`,
      left: `${tooltipLeft}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    });
  };

  const nextStep = async () => {
    if (highlightedElement) {
      highlightedElement.style.boxShadow = "";
      highlightedElement.style.zIndex = "";
      highlightedElement.style.position = "";
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      setTimeout(() => highlightStep(nextStepIndex), 300);
    } else {
      await completeOnboarding();
    }
  };

  const previousStep = () => {
    if (highlightedElement) {
      highlightedElement.style.boxShadow = "";
      highlightedElement.style.zIndex = "";
      highlightedElement.style.position = "";
    }

    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      setTimeout(() => highlightStep(prevStepIndex), 300);
    }
  };

  const skipOnboarding = async () => {
    if (highlightedElement) {
      highlightedElement.style.boxShadow = "";
      highlightedElement.style.zIndex = "";
      highlightedElement.style.position = "";
    }
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setIsVisible(false);
    setHighlightedElement(null);
    setHighlightRect(null);
    
    // Marquer toutes les étapes comme complétées
    try {
      await fetch("/api/onboarding/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la complétion de l'onboarding:", error);
    }
  };

  const handleActionClick = async () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.action) {
      if (step.action.href) {
        router.push(step.action.href);
        // Attendre un peu pour que la navigation se fasse
        setTimeout(() => {
          router.refresh();
          setTimeout(() => nextStep(), 1000);
        }, 500);
      } else if (step.action.onClick) {
        step.action.onClick();
        setTimeout(() => nextStep(), 500);
      }
    }
  };

  if (!isVisible || currentStep >= ONBOARDING_STEPS.length) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Overlay sombre avec trou pour l'élément mis en évidence */}
      {highlightRect && (
        <>
          {/* Overlay avec clip-path pour créer un trou */}
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/60 z-[9998] pointer-events-auto"
            style={{
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${highlightRect.left}px 100%, 
                ${highlightRect.left}px ${highlightRect.top}px, 
                ${highlightRect.left + highlightRect.width}px ${highlightRect.top}px, 
                ${highlightRect.left + highlightRect.width}px ${highlightRect.top + highlightRect.height}px, 
                ${highlightRect.left}px ${highlightRect.top + highlightRect.height}px, 
                ${highlightRect.left}px 100%, 
                100% 100%, 
                100% 0%
              )`,
            }}
            onClick={(e) => {
              // Empêcher les clics sur l'overlay
              e.stopPropagation();
            }}
          />
          
          {/* Bordure animée autour de l'élément */}
          <div
            className="fixed z-[9997] pointer-events-none animate-pulse"
            style={{
              left: `${highlightRect.left - 4}px`,
              top: `${highlightRect.top - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              border: "4px solid rgba(37, 99, 235, 0.8)",
              borderRadius: "8px",
              boxShadow: "0 0 0 4px rgba(37, 99, 235, 0.3), 0 0 20px rgba(37, 99, 235, 0.5)",
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-6 z-[9999] animate-in fade-in zoom-in-95"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">
                Étape {currentStep + 1} sur {ONBOARDING_STEPS.length}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                className="border-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleActionClick}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                {step.action.label}
              </Button>
            )}
            <Button
              size="sm"
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? "Terminer" : "Suivant"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
