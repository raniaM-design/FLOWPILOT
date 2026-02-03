"use client";

import { useMemo, useTransition, useState, useEffect } from "react";
import { FlowCard, FlowCardContent, FlowCardHeader, FlowCardTitle } from "@/components/ui/flow-card";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/timeUrgency";
import { Calendar, User, FileText, AlertCircle, MoreVertical, ArrowRight, CalendarDays, Maximize2, Minimize2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateActionStatus, updateAction } from "@/app/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getActionStatusLabel } from "@/lib/utils/action-status";
import { showActionUpdatedToast } from "@/lib/toast-actions";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ActionItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null; // Sérialisé en string par Next.js
  assignee: {
    id: string;
    email: string;
  } | null;
  decision: {
    id: string;
    title: string;
  } | null;
  meeting: {
    id: string;
    title: string;
  } | null;
};

interface ProjectKanbanBoardProps {
  actions: ActionItem[];
  projectId: string;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

type StatusGroup = "TODO" | "DOING" | "BLOCKED" | "DONE";

// Export pour les tests de validation
export const STATUS_CONFIG: Record<StatusGroup, { label: string; bgColor: string; borderColor: string; textColor: string; badgeColor: string }> = {
  TODO: { 
    label: "À faire", 
    bgColor: "bg-slate-50/40", 
    borderColor: "border-slate-300/50", 
    textColor: "text-slate-700",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
  },
  DOING: { 
    label: "En cours", 
    bgColor: "bg-blue-50/40", 
    borderColor: "border-blue-300/50", 
    textColor: "text-blue-700",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200"
  },
  BLOCKED: { 
    label: "En attente", 
    bgColor: "bg-amber-50/40", 
    borderColor: "border-amber-300/50", 
    textColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200"
  },
  DONE: { 
    label: "Terminé", 
    bgColor: "bg-emerald-50/40", 
    borderColor: "border-emerald-300/50", 
    textColor: "text-emerald-700",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
};

type DisplayMode = "compact" | "comfort" | "large";

const STORAGE_KEY = "kanban-display-mode";
const COLUMN_WIDTHS_STORAGE_KEY = "kanban-column-widths";

const MIN_COLUMN_WIDTH = 200; // px
const MAX_COLUMN_WIDTH = 600; // px
const DEFAULT_COLUMN_WIDTH = 280; // px

// Validation au runtime : vérifier que tous les statuts valides ont un mapping
const VALID_STATUSES: StatusGroup[] = ["TODO", "DOING", "BLOCKED", "DONE"];
const validateStatusMapping = () => {
  const missingStatuses = VALID_STATUSES.filter(status => !(status in STATUS_CONFIG));
  if (missingStatuses.length > 0) {
    console.error(`[Kanban] ERREUR: Statuts sans mapping: ${missingStatuses.join(", ")}`);
    throw new Error(`Statuts Kanban sans mapping: ${missingStatuses.join(", ")}`);
  }
  const invalidStatuses = Object.keys(STATUS_CONFIG).filter(status => !VALID_STATUSES.includes(status as StatusGroup));
  if (invalidStatuses.length > 0) {
    console.error(`[Kanban] ERREUR: Statuts invalides dans STATUS_CONFIG: ${invalidStatuses.join(", ")}`);
    throw new Error(`Statuts invalides dans STATUS_CONFIG: ${invalidStatuses.join(", ")}`);
  }
};
// Exécuter la validation une fois au chargement du module
validateStatusMapping();

export function ProjectKanbanBoard({ actions, projectId, isFullscreen = false, onFullscreenToggle }: ProjectKanbanBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticActions, setOptimisticActions] = useState<ActionItem[]>(actions);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("comfort");
  const [columnWidths, setColumnWidths] = useState<Record<StatusGroup, number>>({
    TODO: DEFAULT_COLUMN_WIDTH,
    DOING: DEFAULT_COLUMN_WIDTH,
    BLOCKED: DEFAULT_COLUMN_WIDTH,
    DONE: DEFAULT_COLUMN_WIDTH,
  });
  const [resizingColumn, setResizingColumn] = useState<StatusGroup | null>(null);

  // Charger le mode d'affichage depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as DisplayMode | null;
    if (saved && ["compact", "comfort", "large"].includes(saved)) {
      setDisplayMode(saved);
    }
  }, []);

  // Charger les largeurs des colonnes depuis localStorage
  useEffect(() => {
    const storageKey = `${COLUMN_WIDTHS_STORAGE_KEY}-${projectId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<StatusGroup, number>;
        // Valider que toutes les colonnes ont une largeur valide
        const validWidths: Record<StatusGroup, number> = {
          TODO: parsed.TODO && parsed.TODO >= MIN_COLUMN_WIDTH && parsed.TODO <= MAX_COLUMN_WIDTH ? parsed.TODO : DEFAULT_COLUMN_WIDTH,
          DOING: parsed.DOING && parsed.DOING >= MIN_COLUMN_WIDTH && parsed.DOING <= MAX_COLUMN_WIDTH ? parsed.DOING : DEFAULT_COLUMN_WIDTH,
          BLOCKED: parsed.BLOCKED && parsed.BLOCKED >= MIN_COLUMN_WIDTH && parsed.BLOCKED <= MAX_COLUMN_WIDTH ? parsed.BLOCKED : DEFAULT_COLUMN_WIDTH,
          DONE: parsed.DONE && parsed.DONE >= MIN_COLUMN_WIDTH && parsed.DONE <= MAX_COLUMN_WIDTH ? parsed.DONE : DEFAULT_COLUMN_WIDTH,
        };
        setColumnWidths(validWidths);
      } catch (error) {
        console.error("Erreur lors du chargement des largeurs:", error);
      }
    }
  }, [projectId]);

  // Sauvegarder le mode d'affichage dans localStorage
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // Sauvegarder les largeurs des colonnes dans localStorage
  const saveColumnWidths = (widths: Record<StatusGroup, number>) => {
    const storageKey = `${COLUMN_WIDTHS_STORAGE_KEY}-${projectId}`;
    localStorage.setItem(storageKey, JSON.stringify(widths));
  };

  // Gérer le début du resize
  const handleResizeStart = (status: StatusGroup, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(status);

    const startX = e.clientX;
    const startWidth = columnWidths[status];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, startWidth + diff));
      
      setColumnWidths((prev) => {
        const updated = { ...prev, [status]: newWidth };
        saveColumnWidths(updated);
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  
  // Grouper les actions par statut avec fallback pour les statuts inconnus
  const groupedActions = useMemo(() => {
    const groups: Record<StatusGroup, ActionItem[]> = {
      TODO: [],
      DOING: [],
      BLOCKED: [],
      DONE: [],
    };

    optimisticActions.forEach((action) => {
      // Mapping fallback : si le statut n'est pas reconnu, mettre dans "À faire"
      const status = (action.status as StatusGroup) || "TODO";
      if (status in groups) {
        groups[status].push(action);
      } else {
        // Fallback pour statuts inconnus
        groups.TODO.push(action);
      }
    });

    return groups;
  }, [optimisticActions]);

  // Configurer les capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Délai de 8px avant activation pour éviter les drags accidentels
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      console.log(`[Kanban] handleDragEnd: over est null, annulation`);
      return;
    }

    const actionId = active.id as string;
    const overId = over.id as string;
    const overData = (over as any).data?.current;
    console.log(`[Kanban] handleDragEnd: actionId=${actionId}, over.id="${overId}", over.id type=${typeof overId}, over.data=`, overData);

    let newStatus: StatusGroup | undefined;

    const validStatuses: StatusGroup[] = ["TODO", "DOING", "BLOCKED", "DONE"];
    
    // Méthode 1: Vérifier si over.data indique que c'est une colonne
    if (overData?.type === "column" && overData?.status) {
      newStatus = overData.status as StatusGroup;
      console.log(`[Kanban] ✓ Drop sur colonne détecté via data: "${newStatus}"`);
    }
    // Méthode 2: Vérifier si over.id est exactement un statut valide (colonne)
    else if (validStatuses.includes(overId as StatusGroup)) {
      newStatus = overId as StatusGroup;
      console.log(`[Kanban] ✓ Drop sur colonne "${newStatus}" (via id direct)`);
    }
    // Méthode 3: Vérifier si over.id correspond à un statut (comparaison stricte)
    else if (overId === "BLOCKED" || overId === "TODO" || overId === "DOING" || overId === "DONE") {
      newStatus = overId as StatusGroup;
      console.log(`[Kanban] ✓ Drop sur colonne "${newStatus}" (via comparaison stricte)`);
    }
    // Méthode 4: On a drop sur une autre carte, trouver le statut de cette carte
    else {
      const targetAction = optimisticActions.find((a) => a.id === overId);
      if (targetAction) {
        newStatus = (targetAction.status as StatusGroup) || "TODO";
        console.log(`[Kanban] ✓ Drop sur carte ${overId}, utilisation du statut de la carte: "${newStatus}"`);
      } else {
        // Méthode 5: Essayer de trouver la colonne parente en cherchant dans toutes les colonnes
        console.log(`[Kanban] Action cible non trouvée directement, recherche dans les colonnes...`);
        for (const [status, actions] of Object.entries(groupedActions)) {
          if (actions.some(a => a.id === overId)) {
            newStatus = status as StatusGroup;
            console.log(`[Kanban] ✓ Action trouvée dans la colonne "${newStatus}" via recherche`);
            break;
          }
        }
        if (!newStatus) {
          console.error(`[Kanban] ✗ Impossible de déterminer le statut pour overId: "${overId}"`);
          console.error(`[Kanban] ✗ overId n'est pas dans validStatuses:`, validStatuses);
          console.error(`[Kanban] ✗ overId n'est pas une action connue`);
          toast.error("Erreur", {
            description: `Impossible de déterminer la colonne cible (overId: ${overId})`,
          });
          return;
        }
      }
    }

    if (!newStatus) {
      console.error(`[Kanban] ✗ newStatus est undefined après traitement`);
      console.error(`[Kanban] ✗ overId="${overId}", overData=`, overData);
      return;
    }

    // Vérification finale que le statut est valide
    if (!validStatuses.includes(newStatus)) {
      console.error(`[Kanban] ✗ newStatus "${newStatus}" n'est pas dans validStatuses:`, validStatuses);
      toast.error("Erreur", {
        description: `Statut invalide: ${newStatus}`,
      });
      return;
    }

    console.log(`[Kanban] ✓ Statut final déterminé: "${newStatus}"`);

    // Trouver l'action actuelle
    const action = optimisticActions.find((a) => a.id === actionId);
    if (!action) return;

    const oldStatus = (action.status as StatusGroup) || "TODO";

    // Si le statut n'a pas changé, ne rien faire
    if (oldStatus === newStatus) return;

    // Log temporaire pour debug
    console.log(`[Kanban] Déplacement: ${actionId} de "${oldStatus}" vers "${newStatus}"`);

    // Mise à jour optimiste
    const updatedActions = optimisticActions.map((a) =>
      a.id === actionId ? { ...a, status: newStatus } : a
    );
    setOptimisticActions(updatedActions);

    // Mettre à jour en base de données
    try {
      console.log(`[Kanban] Appel API updateActionStatus avec status: "${newStatus}"`);
      await updateActionStatus(actionId, newStatus);
      console.log(`[Kanban] Statut mis à jour avec succès: "${newStatus}"`);
      toast.success("Action déplacée", {
        description: `Déplacée vers "${getActionStatusLabel(newStatus)}"`,
      });
      router.refresh();
    } catch (error) {
      // Rollback en cas d'erreur
      console.error(`[Kanban] Erreur lors de la mise à jour:`, error);
      setOptimisticActions(actions);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Impossible de déplacer l'action",
      });
    }
  };

  const activeAction = activeId ? optimisticActions.find((a) => a.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        // Prioriser les colonnes (droppables) sur les cartes (sortables)
        const validStatuses: StatusGroup[] = ["TODO", "DOING", "BLOCKED", "DONE"];
        
        // Utiliser rectIntersection pour une meilleure détection des colonnes
        const collisions = rectIntersection(args);
        
        // Si on trouve une collision avec une colonne (droppable), la prioriser
        const columnCollision = collisions.find((collision) => {
          const id = collision.id as string;
          return validStatuses.includes(id as StatusGroup);
        });
        
        if (columnCollision) {
          return [columnCollision];
        }
        
        // Sinon, retourner toutes les collisions (y compris les cartes)
        return collisions;
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Barre de statistiques compacte avec contrôle d'affichage */}
        <div className="flex items-center justify-between gap-6 px-1 py-3 border-b border-slate-200">
          <div className="flex items-center gap-6">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = groupedActions[status as StatusGroup].length;
              return (
                <div key={status} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">{config.label}</span>
                  <Badge variant="secondary" className="text-xs font-semibold min-w-[24px] justify-center">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          {/* Contrôles d'affichage */}
          <div className="flex items-center gap-4">
            {/* Contrôle d'affichage Compact/Confort/Large */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Affichage:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => handleDisplayModeChange("compact")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    displayMode === "compact"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Compact
                </button>
                <button
                  onClick={() => handleDisplayModeChange("comfort")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    displayMode === "comfort"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Confort
                </button>
                <button
                  onClick={() => handleDisplayModeChange("large")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    displayMode === "large"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Large
                </button>
              </div>
            </div>
            
            {/* Bouton Plein écran */}
            {onFullscreenToggle && (
              <Button
                onClick={onFullscreenToggle}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 mr-1.5" />
                    Quitter le plein écran
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                    Plein écran
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Colonnes Kanban */}
        <div className={cn(
          "flex gap-5 overflow-x-auto",
          displayMode === "compact" && "gap-3",
          displayMode === "large" && "gap-6"
        )}>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const statusActions = groupedActions[status as StatusGroup];
            return (
              <KanbanColumn
                key={status}
                status={status as StatusGroup}
                config={config}
                actions={statusActions}
                displayMode={displayMode}
                width={columnWidths[status as StatusGroup]}
                isResizing={resizingColumn === status}
                onResizeStart={(e) => handleResizeStart(status as StatusGroup, e)}
              />
            );
          })}
        </div>
      </div>

      {/* Overlay pour la carte en cours de drag */}
      <DragOverlay>
        {activeAction ? (
          <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 shadow-lg rotate-2 opacity-95">
            <h4 className="font-semibold text-sm text-slate-900 mb-2.5 line-clamp-2 leading-snug">
              {activeAction.title}
            </h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  config,
  actions,
  displayMode,
  width,
  isResizing,
  onResizeStart,
}: {
  status: StatusGroup;
  config: { label: string; bgColor: string; borderColor: string; textColor: string; badgeColor: string };
  actions: ActionItem[];
  displayMode: DisplayMode;
  width: number;
  isResizing: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "column",
      status: status,
    },
  });

  return (
    <div className="flex flex-col min-w-0 relative group" style={{ width: `${width}px`, flexShrink: 0 }}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col rounded-xl border shadow-sm hover:shadow-md transition-shadow",
          config.bgColor,
          config.borderColor,
          isOver && "ring-2 ring-blue-400 ring-offset-2"
        )}
      >
        {/* Header de colonne */}
        <div className={cn(
          "border-b bg-white/30",
          config.borderColor,
          displayMode === "compact" && "px-3 py-2",
          displayMode === "comfort" && "px-4 py-3",
          displayMode === "large" && "px-5 py-4"
        )}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn(
              "font-semibold tracking-tight",
              config.textColor,
              displayMode === "compact" && "text-xs",
              displayMode === "comfort" && "text-sm",
              displayMode === "large" && "text-base"
            )}>
              {config.label}
            </h3>
            <Badge className={cn(
              "font-semibold min-w-[24px] justify-center border",
              config.badgeColor,
              displayMode === "compact" && "text-[10px] h-4 px-1",
              displayMode === "comfort" && "text-xs h-5 px-1.5",
              displayMode === "large" && "text-xs h-6 px-2"
            )}>
              {actions.length}
            </Badge>
          </div>
        </div>
        {/* Contenu scrollable */}
        <div className={cn(
          "flex-1 overflow-y-auto max-h-[calc(100vh-220px)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400",
          displayMode === "compact" && "px-2 py-2",
          displayMode === "comfort" && "px-3 py-3",
          displayMode === "large" && "px-4 py-4"
        )}>
          <SortableContext items={actions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className={cn(
              displayMode === "compact" && "space-y-2",
              displayMode === "comfort" && "space-y-2.5",
              displayMode === "large" && "space-y-3"
            )}>
              {actions.length === 0 ? (
                <div className={cn(
                  "text-center text-muted-foreground",
                  displayMode === "compact" && "py-8 text-xs",
                  displayMode === "comfort" && "py-12 text-sm",
                  displayMode === "large" && "py-16 text-base"
                )}>
                  Aucune action
                </div>
              ) : (
                actions.map((action) => (
                  <DraggableActionCard key={action.id} action={action} displayMode={displayMode} />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>
      
      {/* Poignée de resize */}
      <div
        onMouseDown={onResizeStart}
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize group-hover:bg-blue-400 transition-colors z-10",
          isResizing && "bg-blue-500"
        )}
        style={{ right: "-2px" }}
      >
        <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

function DraggableActionCard({ action, displayMode }: { action: ActionItem; displayMode: DisplayMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: action.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <ActionCard action={action} displayMode={displayMode} />
    </div>
  );
}

function ActionCard({ action, displayMode }: { action: ActionItem; displayMode: DisplayMode }) {
  const [isPending, startTransition] = useTransition();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clickStartTime, setClickStartTime] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState(action.title);
  const [editDueDate, setEditDueDate] = useState(() => {
    // Convertir la date en format YYYY-MM-DD pour l'input type="date"
    if (!action.dueDate) return "";
    const date = new Date(action.dueDate);
    return date.toISOString().split("T")[0];
  });
  const router = useRouter();
  const currentStatus = (action.status as StatusGroup) || "TODO";

  const formatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return formatShortDate(date);
  };

  // Réinitialiser le formulaire quand le modal s'ouvre
  const handleOpenEditDialog = () => {
    setEditTitle(action.title);
    setEditDueDate(action.dueDate ? new Date(action.dueDate).toISOString().split("T")[0] : "");
    setIsEditDialogOpen(true);
  };

  // Gérer le clic sur la carte (mais pas pendant un drag)
  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas ouvrir le modal si on clique sur le menu dropdown ou sur un bouton
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="menu"]') || 
      target.closest('button') ||
      target.closest('[data-radix-dropdown-menu-trigger]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('a') // Ne pas ouvrir si on clique sur un lien
    ) {
      return;
    }
    
    // Vérifier que ce n'est pas un drag (si le temps entre mousedown et click est trop long, c'est un drag)
    const now = Date.now();
    if (clickStartTime && now - clickStartTime < 200) {
      handleOpenEditDialog();
    }
    setClickStartTime(null);
  };

  const handleCardMouseDown = () => {
    setClickStartTime(Date.now());
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    // Réinitialiser les valeurs
    setEditTitle(action.title);
    setEditDueDate(action.dueDate ? new Date(action.dueDate).toISOString().split("T")[0] : "");
  };

  const handleSaveEdit = async () => {
    // Validation
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || trimmedTitle.length < 2) {
      toast.error("Erreur", {
        description: "Le titre doit contenir au moins 2 caractères",
      });
      return;
    }

    startTransition(async () => {
      try {
        await updateAction(action.id, {
          title: trimmedTitle,
          dueDate: editDueDate || null,
        });
        
        showActionUpdatedToast();
        setIsEditDialogOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'action:", error);
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Impossible de mettre à jour l'action",
        });
      }
    });
  };

  const handleStatusChange = (newStatus: StatusGroup) => {
    if (newStatus === currentStatus || isPending) return;

    // Validation : vérifier que le statut est valide
    const validStatuses: StatusGroup[] = ["TODO", "DOING", "BLOCKED", "DONE"];
    if (!validStatuses.includes(newStatus)) {
      console.error(`[Kanban] Statut invalide dans handleStatusChange: ${newStatus}`);
      toast.error("Erreur", {
        description: `Statut invalide: ${newStatus}`,
      });
      return;
    }

    startTransition(async () => {
      try {
        console.log(`[Kanban] Menu: Appel API updateActionStatus avec status: "${newStatus}"`);
        await updateActionStatus(action.id, newStatus);
        console.log(`[Kanban] Menu: Statut mis à jour avec succès: "${newStatus}"`);
        toast.success("Action déplacée", {
          description: `Déplacée vers "${getActionStatusLabel(newStatus)}"`,
        });
        router.refresh();
      } catch (error) {
        console.error(`[Kanban] Menu: Erreur lors de la mise à jour:`, error);
        toast.error("Erreur", {
          description: error instanceof Error ? error.message : "Impossible de déplacer l'action",
        });
      }
    });
  };

  return (
    <>
      <div 
        className={cn(
          "group bg-white rounded-lg border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 relative cursor-pointer",
          displayMode === "compact" && "p-2.5",
          displayMode === "comfort" && "p-3.5",
          displayMode === "large" && "p-4.5"
        )}
        onClick={handleCardClick}
        onMouseDown={handleCardMouseDown}
      >
      {/* Menu dropdown pour changer le statut - discret et aligné */}
      <div 
        className={cn(
          "absolute opacity-0 group-hover:opacity-100 transition-opacity",
          displayMode === "compact" && "top-2 right-2",
          displayMode === "comfort" && "top-2.5 right-2.5",
          displayMode === "large" && "top-3 right-3"
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 hover:bg-slate-100",
                displayMode === "compact" && "h-5 w-5",
                displayMode === "comfort" && "h-6 w-6",
                displayMode === "large" && "h-7 w-7"
              )}
              disabled={isPending}
            >
              <MoreVertical className={cn(
                "text-slate-400",
                displayMode === "compact" && "h-3 w-3",
                displayMode === "comfort" && "h-3.5 w-3.5",
                displayMode === "large" && "h-4 w-4"
              )} />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
              Déplacer vers
            </div>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const statusKey = status as StatusGroup;
              const isCurrentStatus = statusKey === currentStatus;
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(statusKey)}
                  disabled={isCurrentStatus || isPending}
                  className={cn(
                    "cursor-pointer",
                    isCurrentStatus && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    {isCurrentStatus && (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className={cn(isCurrentStatus && "font-medium")}>
                      {config.label}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Titre - hiérarchie principale */}
      <h4 className={cn(
        "font-semibold text-slate-900 line-clamp-2 leading-snug",
        displayMode === "compact" && "text-xs mb-2 pr-6",
        displayMode === "comfort" && "text-sm mb-2.5 pr-7",
        displayMode === "large" && "text-base mb-3 pr-8"
      )}>
        {action.title}
      </h4>

      {/* Métadonnées - responsable et date */}
      <div className={cn(
        "mb-3",
        displayMode === "compact" && "space-y-1",
        displayMode === "comfort" && "space-y-1.5",
        displayMode === "large" && "space-y-2"
      )}>
        {/* Responsable */}
        {action.assignee ? (
          <div className={cn(
            "flex items-center gap-1.5 text-slate-600",
            displayMode === "compact" && "text-[10px]",
            displayMode === "comfort" && "text-xs",
            displayMode === "large" && "text-sm"
          )}>
            <User className={cn(
              "text-slate-400 flex-shrink-0",
              displayMode === "compact" && "h-2.5 w-2.5",
              displayMode === "comfort" && "h-3 w-3",
              displayMode === "large" && "h-3.5 w-3.5"
            )} />
            <span className="truncate">{action.assignee.email}</span>
          </div>
        ) : (
          <div className={cn(
            "flex items-center gap-1.5 text-amber-600",
            displayMode === "compact" && "text-[10px]",
            displayMode === "comfort" && "text-xs",
            displayMode === "large" && "text-sm"
          )}>
            <AlertCircle className={cn(
              "flex-shrink-0",
              displayMode === "compact" && "h-2.5 w-2.5",
              displayMode === "comfort" && "h-3 w-3",
              displayMode === "large" && "h-3.5 w-3.5"
            )} />
            <span>Responsable manquant</span>
          </div>
        )}

        {/* Date d'échéance */}
        {action.dueDate ? (
          <div className={cn(
            "flex items-center gap-1.5 text-slate-600",
            displayMode === "compact" && "text-[10px]",
            displayMode === "comfort" && "text-xs",
            displayMode === "large" && "text-sm"
          )}>
            <Calendar className={cn(
              "text-slate-400 flex-shrink-0",
              displayMode === "compact" && "h-2.5 w-2.5",
              displayMode === "comfort" && "h-3 w-3",
              displayMode === "large" && "h-3.5 w-3.5"
            )} />
            <span>{formatDate(action.dueDate)}</span>
          </div>
        ) : (
          <div className={cn(
            "flex items-center gap-1.5 text-slate-400",
            displayMode === "compact" && "text-[10px]",
            displayMode === "comfort" && "text-xs",
            displayMode === "large" && "text-sm"
          )}>
            <Calendar className={cn(
              "flex-shrink-0",
              displayMode === "compact" && "h-2.5 w-2.5",
              displayMode === "comfort" && "h-3 w-3",
              displayMode === "large" && "h-3.5 w-3.5"
            )} />
            <span>Date à définir</span>
          </div>
        )}
      </div>

      {/* Tags - Décision et Réunion en bas, discrets */}
      {(action.decision || action.meeting) && (
        <div className={cn(
          "flex flex-wrap border-t border-slate-100/60",
          displayMode === "compact" && "gap-1 pt-2",
          displayMode === "comfort" && "gap-1.5 pt-2.5",
          displayMode === "large" && "gap-2 pt-3"
        )}>
          {action.decision && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium bg-slate-100/80 text-slate-600 border border-slate-200/50",
              displayMode === "compact" && "px-1.5 py-0.5 text-[9px]",
              displayMode === "comfort" && "px-2 py-0.5 text-[10px]",
              displayMode === "large" && "px-2.5 py-1 text-[11px]"
            )}>
              <FileText className={cn(
                "flex-shrink-0",
                displayMode === "compact" && "h-2 w-2",
                displayMode === "comfort" && "h-2.5 w-2.5",
                displayMode === "large" && "h-3 w-3"
              )} />
              <span className={cn(
                "truncate",
                displayMode === "compact" && "max-w-[80px]",
                displayMode === "comfort" && "max-w-[100px]",
                displayMode === "large" && "max-w-[120px]"
              )}>
                {action.decision.title || "Décision"}
              </span>
            </span>
          )}
          {action.meeting && (
            <Link href={`/app/meetings/${action.meeting.id}/analyze`} className="inline-block">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full font-medium bg-slate-100/80 text-slate-600 border border-slate-200/50 hover:bg-slate-200/60 hover:border-slate-300/60 transition-colors cursor-pointer",
                displayMode === "compact" && "px-1.5 py-0.5 text-[9px]",
                displayMode === "comfort" && "px-2 py-0.5 text-[10px]",
                displayMode === "large" && "px-2.5 py-1 text-[11px]"
              )}>
                <CalendarDays className={cn(
                  "flex-shrink-0",
                  displayMode === "compact" && "h-2 w-2",
                  displayMode === "comfort" && "h-2.5 w-2.5",
                  displayMode === "large" && "h-3 w-3"
                )} />
                <span className={cn(
                  "truncate",
                  displayMode === "compact" && "max-w-[80px]",
                  displayMode === "comfort" && "max-w-[100px]",
                  displayMode === "large" && "max-w-[120px]"
                )}>
                  {action.meeting.title || "Réunion"}
                </span>
              </span>
            </Link>
          )}
        </div>
      )}
      </div>

      {/* Modal d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">Détails de l'action</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Modifiez les informations de l'action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Titre */}
            <div className="space-y-2.5">
              <Label htmlFor="edit-title" className="text-sm font-medium text-slate-900">
                Titre de l'action
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre de l'action"
                className="w-full h-12 px-4 py-3 text-lg font-medium bg-white border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 transition-all"
                style={{ caretColor: '#3b82f6' }}
              />
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2.5">
              <Label htmlFor="edit-due-date" className="text-sm font-medium text-slate-900">
                Date d'échéance
              </Label>
              <Input
                id="edit-due-date"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full h-11 px-4 py-2.5 text-base bg-white border-2 border-slate-300 rounded-lg text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 transition-all"
                style={{ caretColor: '#3b82f6' }}
              />
            </div>

            {/* Responsable (affichage seulement pour l'instant) */}
            {action.assignee && (
              <div className="space-y-2.5">
                <Label className="text-sm font-medium text-slate-900">Responsable</Label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-base text-slate-700">{action.assignee.email}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

