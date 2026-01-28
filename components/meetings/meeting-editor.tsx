"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import { Mark, mergeAttributes } from "@tiptap/core";
import type { RawCommands } from "@tiptap/core";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Palette,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface MeetingEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  name?: string;
  className?: string;
}

const COLOR_PALETTE = [
  { label: "Par défaut", value: null, class: "text-foreground" },
  { label: "Gris", value: "#64748B", class: "text-slate-500" },
  { label: "Bleu", value: "#2563EB", class: "text-blue-600" },
  { label: "Vert", value: "#22C55E", class: "text-emerald-600" },
  { label: "Orange", value: "#F59E0B", class: "text-orange-600" },
  { label: "Rouge", value: "#EF4444", class: "text-red-600" },
];

const HIGHLIGHT_COLORS = [
  { label: "Jaune", value: "#FEF08A", class: "bg-yellow-200" },
  { label: "Vert", value: "#D1FAE5", class: "bg-emerald-200" },
  { label: "Bleu", value: "#DBEAFE", class: "bg-blue-200" },
  { label: "Rose", value: "#FCE7F3", class: "bg-pink-200" },
];

/**
 * Extension simple pour le surlignage
 * Utilise un span avec background-color
 */
const Highlight = Mark.create({
  name: "highlight",
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[style*='background-color']",
        getAttrs: (node: any) => {
          const style = node.style?.backgroundColor || "";
          return { backgroundColor: style };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, {
        style: HTMLAttributes.backgroundColor
          ? `background-color: ${HTMLAttributes.backgroundColor}`
          : undefined,
      }),
      0,
    ];
  },

  addAttributes() {
    return {
      backgroundColor: {
        default: null,
        parseHTML: (element: any) => {
          const style = element.style?.backgroundColor;
          return style || null;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setHighlight: (color: string) => ({ commands }: any) => {
        return commands.setMark(this.name, { backgroundColor: color });
      },
      unsetHighlight: () => ({ commands }: any) => {
        return commands.unsetMark(this.name);
      },
    } as Partial<RawCommands>;
  },
});

/**
 * Composant Editor complet pour les comptes rendus de réunion
 * Avec toolbar fixe et toutes les fonctionnalités de formatage
 */
export function MeetingEditor({
  value = "",
  onChange,
  placeholder = "Commencez à écrire votre compte rendu...",
  name,
  className,
}: MeetingEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [editorValue, setEditorValue] = useState(value);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Highlight,
    ],
    content: value || "",
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorValue(html);
      onChange?.(html);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      setShowColorPicker(false);
      setShowLinkDialog(false);
      setShowHighlightPicker(false);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-base max-w-none focus:outline-none",
          "prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-4",
          "prose-p:my-4 prose-p:leading-relaxed prose-p:text-[18px] prose-p:leading-[1.8]",
          "prose-ul:my-4 prose-ul:pl-6",
          "prose-ol:my-4 prose-ol:pl-6",
          "prose-li:my-2 prose-li:text-[18px] prose-li:leading-[1.8]",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-em:text-foreground prose-em:italic",
          "prose-u:underline",
          "prose-a:text-blue-600 prose-a:underline",
          "min-h-[60vh] p-8 text-[18px] leading-[1.8]"
        ),
      },
      // Transformer le contenu collé pour le nettoyer et le rendre lisible
      transformPastedHTML(html: string) {
        // TipTap nettoie déjà le HTML, mais on peut ajouter des transformations supplémentaires si nécessaire
        // Par exemple, convertir les <br> en paragraphes, nettoyer les styles inline excessifs, etc.
        return html;
      },
    },
  });

  // Mettre à jour le contenu si value change de l'extérieur
  useEffect(() => {
    if (editor && value !== editorValue) {
      editor.commands.setContent(value || "");
      setEditorValue(value);
    }
  }, [value, editor, editorValue]);

  // Gérer les clics en dehors des pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (linkInputRef.current && !linkInputRef.current.contains(event.target as Node)) {
        setShowLinkDialog(false);
      }
    };

    if (showColorPicker || showLinkDialog || showHighlightPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker, showLinkDialog, showHighlightPicker]);

  // Fallback : textarea simple si l'éditeur ne se charge pas
  if (editorError || !editor) {
    return (
      <div className={cn("space-y-2", className)}>
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full min-h-[60vh] p-8 rounded-xl bg-slate-50/80 border border-slate-200/60",
            "focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:bg-white focus:shadow-sm focus:border-blue-300/40",
            "text-[18px] leading-[1.8] resize-none",
            "transition-all duration-200"
          )}
        />
        <p className="text-xs text-slate-400">
          Mode texte simple (l'éditeur enrichi n'a pas pu se charger)
        </p>
      </div>
    );
  }

  const currentColor = editor.getAttributes("textStyle").color || null;
  const currentLink = editor.getAttributes("link");

  const handleSetLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkDialog(false);
    setLinkUrl("");
  };

  const handleSetHighlight = (color: string) => {
  if (!editor) return;

  (editor.chain() as any).focus().setHighlight(color).run();
  setShowHighlightPicker(false);
};
  return (
    <div className={cn("relative", className)}>
      {/* Input caché pour les formulaires */}
      {name && <input type="hidden" name={name} value={editorValue} />}

      {/* Toolbar fixe en haut */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200/60 rounded-t-xl p-3 flex items-center gap-1 flex-wrap">
        {/* Format de texte */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Gras"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italique"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Souligné"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Titres */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) && "bg-accent")}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Titre 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-accent")}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Titre 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 3 }) && "bg-accent")}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Titre 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Listes */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Liste à puces"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Liste numérotée"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Lien */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-2 relative" ref={linkInputRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-accent")}
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkDialog(true);
                setLinkUrl(currentLink?.href || "");
              }
            }}
            title="Lien"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          {showLinkDialog && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover rounded-lg shadow-lg z-30 border border-border">
              <div className="flex items-center gap-2">
                <Input
                  ref={linkInputRef}
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSetLink();
                    }
                    if (e.key === "Escape") {
                      setShowLinkDialog(false);
                      setLinkUrl("");
                    }
                  }}
                  className="w-64 h-8 text-sm"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSetLink}
                  className="h-8"
                >
                  OK
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl("");
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Couleur de texte */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-2 relative" ref={colorPickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", currentColor && "bg-accent")}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Couleur du texte"
          >
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover rounded-lg shadow-lg z-30 border border-border">
              <div className="space-y-1">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.value || "default"}
                    type="button"
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex items-center gap-2 text-popover-foreground",
                      color.class
                    )}
                    onClick={() => {
                      if (color.value) {
                        editor.chain().focus().setColor(color.value).run();
                      } else {
                        editor.chain().focus().unsetColor().run();
                      }
                      setShowColorPicker(false);
                    }}
                  >
                    <div
                      className={cn(
                        "w-3 h-3 rounded border border-border",
                        color.value ? "" : "bg-muted"
                      )}
                      style={color.value ? { backgroundColor: color.value } : {}}
                    />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Surlignage */}
        <div className="flex items-center gap-1 relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            title="Surligner"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover rounded-lg shadow-lg z-30 border border-border">
              <div className="space-y-1">
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex items-center gap-2 text-popover-foreground"
                  onClick={() => {
                    if (!editor) return;

                    (editor.chain() as any).focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                >
                  <div className="w-3 h-3 rounded border border-border bg-transparent" />
                  Enlever le surlignage
                </button>
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex items-center gap-2 text-popover-foreground"
                    onClick={() => handleSetHighlight(color.value)}
                  >
                    <div
                      className={cn("w-3 h-3 rounded border border-border", color.class)}
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Éditeur */}
      <div
        className={cn(
          "rounded-b-xl bg-slate-50/80 border-x border-b border-slate-200/60 transition-all duration-200",
          isFocused && "ring-2 ring-blue-400/50 ring-offset-2 bg-white shadow-sm border-blue-300/40",
          "min-h-[60vh]"
        )}
      >
        <EditorContent editor={editor} />
        {!editor.getText() && !isFocused && (
          <div className="absolute top-8 left-8 text-lg text-slate-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

