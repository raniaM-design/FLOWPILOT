"use client";

/**
 * BoardTemplatesDropdown — dropdown Templates avec Réunion, RACI, SWOT
 * Crée des éléments pré-positionnés sur le canvas
 */
import { useEditor } from "tldraw";
import { toRichText } from "@tldraw/tlschema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LayoutTemplate, Calendar, Grid3X3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function useInsertTemplate() {
  const editor = useEditor();
  return (templateId: "reunion" | "raci" | "swot") => {
    const viewport = editor.getViewportPageBounds();
    const cx = viewport.x + viewport.w / 2;
    const cy = viewport.y + viewport.h / 2;

    if (templateId === "reunion") {
      editor.createShapes([
        {
          type: "note",
          x: cx - 200,
          y: cy - 120,
          props: {
            richText: toRichText("Agenda"),
            color: "blue",
          },
        },
        {
          type: "note",
          x: cx - 60,
          y: cy - 120,
          props: {
            richText: toRichText("Décisions"),
            color: "violet",
          },
        },
        {
          type: "note",
          x: cx + 80,
          y: cy - 120,
          props: {
            richText: toRichText("Actions"),
            color: "green",
          },
        },
      ]);
    }

    if (templateId === "raci") {
      const pad = 140;
      editor.createShapes([
        {
          type: "note",
          x: cx - pad * 2,
          y: cy - 60,
          props: { richText: toRichText("R - Responsable"), color: "blue" },
        },
        {
          type: "note",
          x: cx - pad,
          y: cy - 60,
          props: { richText: toRichText("A - Accountable"), color: "violet" },
        },
        {
          type: "note",
          x: cx,
          y: cy - 60,
          props: { richText: toRichText("C - Consulted"), color: "yellow" },
        },
        {
          type: "note",
          x: cx + pad,
          y: cy - 60,
          props: { richText: toRichText("I - Informed"), color: "green" },
        },
      ]);
    }

    if (templateId === "swot") {
      const s = 120;
      editor.createShapes([
        {
          type: "note",
          x: cx - s - 80,
          y: cy - s - 40,
          props: { richText: toRichText("Forces"), color: "green" },
        },
        {
          type: "note",
          x: cx + 20,
          y: cy - s - 40,
          props: { richText: toRichText("Faiblesses"), color: "red" },
        },
        {
          type: "note",
          x: cx - s - 80,
          y: cy + 20,
          props: { richText: toRichText("Opportunités"), color: "blue" },
        },
        {
          type: "note",
          x: cx + 20,
          y: cy + 20,
          props: { richText: toRichText("Menaces"), color: "orange" },
        },
      ]);
    }

    editor.setCurrentTool("select");
  };
}

const TEMPLATES = [
  {
    id: "reunion" as const,
    label: "Réunion",
    desc: "Agenda / Décisions / Actions",
    icon: Calendar,
  },
  {
    id: "raci" as const,
    label: "RACI",
    desc: "Responsable / Accountable / Consulted / Informed",
    icon: Grid3X3,
  },
  {
    id: "swot" as const,
    label: "SWOT",
    desc: "Forces / Faiblesses / Opportunités / Menaces",
    icon: TrendingUp,
  },
];

export function BoardTemplatesDropdown() {
  const insertTemplate = useInsertTemplate();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 rounded-xl gap-2 px-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/90",
                "dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80"
              )}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">Templates</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
          Templates <kbd className="ml-1 px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]">T</kbd>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={12}
        className={cn(
          "w-56 rounded-xl p-1",
          "border border-zinc-200/90 dark:border-zinc-800",
          "shadow-lg bg-white dark:bg-zinc-900"
        )}
      >
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => insertTemplate(t.id)}
              className="flex items-start gap-3 rounded-lg cursor-pointer py-2.5 px-3"
            >
              <div className="mt-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1.5">
                <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <span className="font-medium text-sm">{t.label}</span>
                <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
