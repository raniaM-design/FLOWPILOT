"use client";

/**
 * Board Toolbar — design 2026, créatif et engageant
 * Symboles, flèches, formes, typographie : interface type creative suite
 */
import { useEffect, useState } from "react";
import { track, useEditor, useValue } from "tldraw";
import {
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
} from "@tldraw/tlschema";
import type {
  TLDefaultColorStyle,
  TLDefaultFillStyle,
  TLDefaultFontStyle,
  TLDefaultSizeStyle,
} from "@tldraw/tlschema";
import type { TLGeoShapeGeoStyle } from "@tldraw/tlschema";
import {
  MousePointer2,
  Hand,
  StickyNote,
  Type,
  Square,
  ImagePlus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Shapes,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Star,
  Heart,
  Bold,
  Italic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BoardTemplatesDropdown } from "./board-templates";

/** Palette enrichie — couleurs vives et harmonieuses style 2026 */
const COLOR_MAP: Record<TLDefaultColorStyle, { hex: string; name: string }> = {
  black: { hex: "#0f0f0f", name: "Noir" },
  grey: { hex: "#71717a", name: "Ardoise" },
  "light-violet": { hex: "#c084fc", name: "Lavande" },
  violet: { hex: "#8b5cf6", name: "Violet" },
  blue: { hex: "#3b82f6", name: "Bleu" },
  "light-blue": { hex: "#38bdf8", name: "Ciel" },
  yellow: { hex: "#facc15", name: "Ambre" },
  orange: { hex: "#f97316", name: "Mandarine" },
  green: { hex: "#22c55e", name: "Émeraude" },
  "light-green": { hex: "#4ade80", name: "Menthe" },
  "light-red": { hex: "#fb7185", name: "Corail" },
  red: { hex: "#ef4444", name: "Rouge" },
  white: { hex: "#fafafa", name: "Blanc" },
};

/** Symboles et flèches insertibles */
const ARROW_PRESETS: { id: string; label: string; icon: React.ElementType; start: { x: number; y: number }; end: { x: number; y: number }; arrowheadStart?: string; arrowheadEnd?: string }[] = [
  { id: "arrow-right", label: "Flèche droite", icon: ArrowRight, start: { x: 0, y: 0 }, end: { x: 120, y: 0 }, arrowheadEnd: "arrow" },
  { id: "arrow-left", label: "Flèche gauche", icon: ArrowLeft, start: { x: 120, y: 0 }, end: { x: 0, y: 0 }, arrowheadEnd: "arrow" },
  { id: "arrow-up", label: "Flèche haut", icon: ArrowUp, start: { x: 0, y: 80 }, end: { x: 0, y: 0 }, arrowheadEnd: "arrow" },
  { id: "arrow-down", label: "Flèche bas", icon: ArrowDown, start: { x: 0, y: 0 }, end: { x: 0, y: 80 }, arrowheadEnd: "arrow" },
  { id: "arrow-both", label: "Double sens", icon: ArrowLeftRight, start: { x: 0, y: 0 }, end: { x: 120, y: 0 }, arrowheadStart: "arrow", arrowheadEnd: "arrow" },
];

const GEO_SYMBOLS: { geo: TLGeoShapeGeoStyle; label: string; icon: React.ElementType; w: number; h: number }[] = [
  { geo: "rectangle", label: "Rectangle", icon: Square, w: 100, h: 60 },
  { geo: "ellipse", label: "Ovale", icon: Circle, w: 90, h: 60 },
  { geo: "triangle", label: "Triangle", icon: Triangle, w: 80, h: 70 },
  { geo: "diamond", label: "Losange", icon: Diamond, w: 70, h: 70 },
  { geo: "hexagon", label: "Hexagone", icon: Hexagon, w: 80, h: 70 },
  { geo: "star", label: "Étoile", icon: Star, w: 70, h: 70 },
  { geo: "heart", label: "Cœur", icon: Heart, w: 70, h: 65 },
];

/** Polices et tailles — typographie */
const FONT_OPTIONS: { value: TLDefaultFontStyle; label: string }[] = [
  { value: "draw", label: "Dessin" },
  { value: "sans", label: "Sans serif" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];

const SIZE_OPTIONS: { value: TLDefaultSizeStyle; label: string }[] = [
  { value: "s", label: "Petit" },
  { value: "m", label: "Moyen" },
  { value: "l", label: "Grand" },
  { value: "xl", label: "Très grand" },
];

/** Palettes thématiques — ambiance créative */
const COLOR_PALETTES: { label: string; emoji: string; colors: TLDefaultColorStyle[] }[] = [
  { label: "Soleil", emoji: "☀️", colors: ["yellow", "orange", "light-red", "red", "white"] },
  { label: "Océan", emoji: "🌊", colors: ["blue", "light-blue", "light-violet", "violet", "white"] },
  { label: "Forêt", emoji: "🌿", colors: ["green", "light-green", "blue", "grey", "black"] },
  { label: "Neon", emoji: "✨", colors: ["light-violet", "violet", "light-blue", "light-green", "light-red"] },
  { label: "Terre", emoji: "🪨", colors: ["black", "grey", "orange", "yellow", "white"] },
  { label: "Classique", emoji: "●", colors: ["black", "grey", "blue", "red", "white"] },
];

/** Styles de remplissage avec prévisualisation visuelle */
const FILL_STYLES: {
  value: TLDefaultFillStyle;
  label: string;
  preview: (color: string) => React.ReactNode;
}[] = [
  {
    value: "none",
    label: "Contour",
    preview: (c) => (
      <div
        className="w-full h-full rounded-lg border-2 border-current"
        style={{ borderColor: c, backgroundColor: "transparent" }}
      />
    ),
  },
  {
    value: "semi",
    label: "Voilé",
    preview: (c) => (
      <div
        className="w-full h-full rounded-lg border border-black/10"
        style={{ backgroundColor: c, opacity: 0.5 }}
      />
    ),
  },
  {
    value: "solid",
    label: "Plein",
    preview: (c) => (
      <div
        className="w-full h-full rounded-lg"
        style={{ backgroundColor: c }}
      />
    ),
  },
  {
    value: "pattern",
    label: "Hachures",
    preview: (c) => (
      <div
        className="w-full h-full rounded-lg relative overflow-hidden"
        style={{ backgroundColor: c }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2">
          <line x1="0" y1="0" x2="24" y2="24" />
          <line x1="24" y1="0" x2="0" y2="24" />
          <line x1="12" y1="0" x2="12" y2="24" />
          <line x1="0" y1="12" x2="24" y2="12" />
        </svg>
      </div>
    ),
  },
  {
    value: "fill",
    label: "Rempli",
    preview: (c) => (
      <div
        className="w-full h-full rounded-lg"
        style={{ backgroundColor: c }}
      />
    ),
  },
  {
    value: "lined-fill",
    label: "Rayures",
    preview: (c) => (
      <div
        className="w-full h-full rounded-lg relative overflow-hidden"
        style={{ backgroundColor: c }}
      >
        <div className="absolute inset-0 flex flex-col justify-around">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-0.5 bg-black/20" />
          ))}
        </div>
      </div>
    ),
  },
];

export const BoardToolbar = track(function BoardToolbar() {
  const editor = useEditor();
  const currentToolId = editor.getCurrentToolId();
  const currentColor = editor.getStyleForNextShape(DefaultColorStyle);
  const currentFill = editor.getStyleForNextShape(DefaultFillStyle);
  const hasSelection = editor.getSelectedShapes().length > 0;
  const currentHex = COLOR_MAP[currentColor ?? "black"].hex;
  const currentFont = editor.getStyleForNextShape(DefaultFontStyle);
  const currentSize = editor.getStyleForNextShape(DefaultSizeStyle);
  const richTextEditor = useValue("richTextEditor", () => editor.getRichTextEditor(), [editor]);
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!richTextEditor) return;
    const fn = () => forceUpdate((x) => x + 1);
    richTextEditor.on("update", fn);
    richTextEditor.on("selectionUpdate", fn);
    return () => {
      richTextEditor.off("update", fn);
      richTextEditor.off("selectionUpdate", fn);
    };
  }, [richTextEditor]);

  const setColor = (color: TLDefaultColorStyle) => {
    if (hasSelection) {
      editor.setStyleForSelectedShapes(DefaultColorStyle, color);
    } else {
      editor.setStyleForNextShapes(DefaultColorStyle, color);
    }
  };

  const setFill = (fill: TLDefaultFillStyle) => {
    if (hasSelection) {
      editor.setStyleForSelectedShapes(DefaultFillStyle, fill);
    } else {
      editor.setStyleForNextShapes(DefaultFillStyle, fill);
    }
  };

  const setFont = (font: TLDefaultFontStyle) => {
    if (hasSelection) {
      editor.setStyleForSelectedShapes(DefaultFontStyle, font);
    } else {
      editor.setStyleForNextShapes(DefaultFontStyle, font);
    }
  };

  const setSize = (size: TLDefaultSizeStyle) => {
    if (hasSelection) {
      editor.setStyleForSelectedShapes(DefaultSizeStyle, size);
    } else {
      editor.setStyleForNextShapes(DefaultSizeStyle, size);
    }
  };

  const viewport = editor.getViewportPageBounds();
  const vpCenter = { x: viewport.x + viewport.w / 2, y: viewport.y + viewport.h / 2 };

  const insertArrow = (preset: (typeof ARROW_PRESETS)[0]) => {
    const midX = (preset.start.x + preset.end.x) / 2;
    const midY = (preset.start.y + preset.end.y) / 2;
    const shape = editor.createShape({
      type: "arrow",
      x: vpCenter.x - midX,
      y: vpCenter.y - midY,
      props: {
        start: preset.start,
        end: preset.end,
        arrowheadStart: (preset.arrowheadStart as "arrow" | "none") ?? "none",
        arrowheadEnd: (preset.arrowheadEnd as "arrow") ?? "arrow",
        color: currentColor ?? "black",
        fill: "none",
      },
    });
    editor.select(shape.id);
    editor.setCurrentTool("select");
  };

  const insertGeo = (symbol: (typeof GEO_SYMBOLS)[0]) => {
    const shape = editor.createShape({
      type: "geo",
      x: vpCenter.x - symbol.w / 2,
      y: vpCenter.y - symbol.h / 2,
      props: {
        geo: symbol.geo,
        w: symbol.w,
        h: symbol.h,
        color: currentColor ?? "black",
        fill: currentFill ?? "semi",
      },
    });
    editor.select(shape.id);
    editor.setCurrentTool("select");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "absolute top-6 left-1/2 -translate-x-1/2 z-[300]",
          "flex items-center gap-1",
          "rounded-2xl",
          "bg-white/80 dark:bg-zinc-950/95 backdrop-blur-xl",
          "border border-slate-200/80 dark:border-zinc-800/80",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_8px_-2px_rgba(0,0,0,0.05),0_12px_40px_-12px_rgba(0,0,0,0.08)]",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_8px_-2px_rgba(0,0,0,0.3)]",
          "px-3 py-2.5",
          "transition-all duration-300"
        )}
      >
        {/* Outils */}
        <div className="flex items-center gap-0.5">
          {[
            { id: "select", icon: MousePointer2, label: "Sélectionner", shortcut: "V" },
            { id: "hand", icon: Hand, label: "Déplacer", shortcut: "H" },
            { id: "note", icon: StickyNote, label: "Post-it", shortcut: "N" },
            { id: "text", icon: Type, label: "Texte", shortcut: "T" },
            { id: "geo", icon: Square, label: "Forme", shortcut: "R" },
            { id: "arrow", icon: ArrowRight, label: "Flèche", shortcut: "A" },
          ].map(({ id, icon: Icon, label, shortcut }) => {
            const isActive = currentToolId === id;
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br from-[hsl(var(--brand))]/20 to-[hsl(var(--brand))]/5 text-[hsl(var(--brand))]"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80"
                    )}
                    onClick={() => editor.setCurrentTool(id)}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
                  {label}
                  {shortcut && <kbd className="ml-1.5 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono">{shortcut}</kbd>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Templates */}
        <BoardTemplatesDropdown />

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Symboles & flèches */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl gap-2 px-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
                >
                  <Shapes className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Symboles</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Symboles et flèches
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={12}
            className={cn(
              "p-4 rounded-2xl w-[300px]",
              "border border-zinc-200/90 dark:border-zinc-800",
              "shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]",
              "dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]",
              "bg-white dark:bg-zinc-900"
            )}
          >
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Flèches
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {ARROW_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => insertArrow(preset)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200",
                          "hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
                          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/40 focus:ring-offset-2"
                        )}
                        title={preset.label}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate w-full text-center">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shapes className="h-3.5 w-3.5" />
                  Formes
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {GEO_SYMBOLS.map((symbol) => {
                    const Icon = symbol.icon;
                    return (
                      <button
                        key={symbol.geo}
                        type="button"
                        onClick={() => insertGeo(symbol)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200",
                          "hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
                          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/40 focus:ring-offset-2"
                        )}
                        title={symbol.label}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: COLOR_MAP[currentColor ?? "black"].hex, color: "white" }}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2} fill="currentColor" fillOpacity={0.5} />
                        </div>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate w-full text-center">
                          {symbol.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Couleur — palettes thématiques */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl gap-2 px-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
                >
                  <div
                    className="w-5 h-5 rounded-lg shadow-inner ring-1 ring-black/5 dark:ring-white/10"
                    style={{ backgroundColor: currentHex }}
                  />
                  <Sparkles className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Couleur
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="center"
            side="bottom"
            sideOffset={12}
            className={cn(
              "p-4 rounded-2xl w-[320px]",
              "border border-zinc-200/90 dark:border-zinc-800",
              "shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]",
              "dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]",
              "bg-white dark:bg-zinc-900"
            )}
          >
            <div className="space-y-4">
              {COLOR_PALETTES.map((palette) => (
                <div key={palette.label}>
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>{palette.emoji}</span>
                    {palette.label}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {palette.colors.map((name) => {
                      const isSelected = currentColor === name;
                      const { hex } = COLOR_MAP[name];
                      const light = ["white", "yellow", "light-green", "light-red", "light-blue", "light-violet"].includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          className={cn(
                            "relative h-8 w-8 rounded-xl transition-all duration-200",
                            "hover:scale-110 hover:shadow-lg focus:outline-none",
                            "ring-offset-2 focus:ring-2 focus:ring-[hsl(var(--brand))]/50",
                            light && "ring-1 ring-zinc-200/80 dark:ring-zinc-600/80"
                          )}
                          style={{
                            backgroundColor: hex,
                            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${hex}` : undefined,
                          }}
                          onClick={() => setColor(name)}
                          title={COLOR_MAP[name].name}
                        >
                          {isSelected && (
                            <span
                              className={cn(
                                "absolute inset-0 flex items-center justify-center drop-shadow-sm",
                                light ? "text-zinc-800" : "text-white"
                              )}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Remplissage — cartes visuelles */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl gap-2 px-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
                >
                  <div
                    className="w-5 h-5 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-600"
                    style={{ color: currentHex }}
                  >
                    {FILL_STYLES.find((f) => f.value === currentFill)?.preview(currentHex) ?? (
                      <div className="w-full h-full" style={{ backgroundColor: currentHex }} />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Remplissage
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="center"
            side="bottom"
            sideOffset={12}
            className={cn(
              "p-4 rounded-2xl w-[240px]",
              "border border-zinc-200/90 dark:border-zinc-800",
              "shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]",
              "dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)]",
              "bg-white dark:bg-zinc-900"
            )}
          >
            <div className="grid grid-cols-2 gap-2">
              {FILL_STYLES.map(({ value, label, preview }) => {
                const isSelected = currentFill === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFill(value)}
                    className={cn(
                      "group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
                      "hover:bg-zinc-50 dark:hover:bg-zinc-800/80",
                      "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/40 focus:ring-offset-2",
                      isSelected && "ring-2 ring-[hsl(var(--brand))] bg-[hsl(var(--brand))]/5"
                    )}
                  >
                    <div
                      className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition-transform"
                      style={{ color: currentHex }}
                    >
                      {preview(currentHex)}
                    </div>
                    <span className={cn("text-[11px] font-medium", isSelected ? "text-[hsl(var(--brand))]" : "text-zinc-600 dark:text-zinc-400")}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Typographie — police, taille, gras, italique */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl px-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
                >
                  <Type className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium hidden sm:inline" style={{ fontFamily: currentFont === "serif" ? "Georgia, serif" : currentFont === "mono" ? "monospace" : "inherit" }}>
                    {FONT_OPTIONS.find((f) => f.value === currentFont)?.label ?? "Moyen"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Police
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" side="bottom" sideOffset={12} className="rounded-2xl p-2 w-44 border border-zinc-200/90 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900">
            {FONT_OPTIONS.map(({ value, label }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setFont(value)}
                className={cn("cursor-pointer rounded-lg", currentFont === value && "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]")}
              >
                <span style={{ fontFamily: value === "serif" ? "Georgia, serif" : value === "mono" ? "monospace" : "inherit" }}>{label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 rounded-xl px-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/80 transition-all">
                  <span className="text-xs font-medium">
                    {SIZE_OPTIONS.find((s) => s.value === currentSize)?.label ?? "Moyen"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Taille
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" side="bottom" sideOffset={12} className="rounded-2xl p-2 w-40 border border-zinc-200/90 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900">
            {SIZE_OPTIONS.map(({ value, label }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setSize(value)}
                className={cn(
                  "cursor-pointer rounded-lg",
                  currentSize === value && "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]",
                  value === "s" && "text-sm",
                  value === "m" && "text-base",
                  value === "l" && "text-lg",
                  value === "xl" && "text-xl"
                )}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Gras & Italique — uniquement en édition de texte */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl transition-all",
                richTextEditor?.isActive("bold") ? "bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80",
                !richTextEditor && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => richTextEditor?.chain().focus().toggleBold().run()}
              disabled={!richTextEditor}
            >
              <Bold className="h-4 w-4" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
            Gras {!richTextEditor && "(éditez un texte)"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl transition-all",
                richTextEditor?.isActive("italic") ? "bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80",
                !richTextEditor && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => richTextEditor?.chain().focus().toggleItalic().run()}
              disabled={!richTextEditor}
            >
              <Italic className="h-4 w-4" strokeWidth={2.5} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
            Italique {!richTextEditor && "(éditez un texte)"}
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Image */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/90 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/80 transition-all"
              onClick={() => editor.setCurrentTool("select")}
            >
              <ImagePlus className="h-4 w-4" strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
            Image <kbd className="ml-1 px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]">I</kbd>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        {/* Historique & zoom */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-40 transition-all"
                onClick={() => editor.undo()}
                disabled={!editor.getCanUndo()}
              >
                <Undo2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Annuler <kbd className="ml-1 px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]">Ctrl+Z</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-40 transition-all"
                onClick={() => editor.redo()}
                disabled={!editor.getCanRedo()}
              >
                <Redo2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">
              Rétablir <kbd className="ml-1 px-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]">Ctrl+Y</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-7 mx-1 bg-gradient-to-b from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80 transition-all"
                onClick={() => editor.zoomOut()}
              >
                <ZoomOut className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">Zoom −</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80 transition-all"
                onClick={() => editor.zoomIn()}
              >
                <ZoomIn className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">Zoom +</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/80 transition-all"
                onClick={() => editor.zoomToFit()}
              >
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10} className="rounded-xl text-xs font-medium px-3 py-2">Ajuster</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
});
