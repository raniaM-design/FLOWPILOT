"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

interface RichTextFieldProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  name?: string;
  className?: string;
  editable?: boolean;
  readOnly?: boolean;
}

const COLOR_PALETTE = [
  { label: "Par défaut", value: null, class: "text-foreground" },
  { label: "Gris", value: "#64748B", class: "text-muted-foreground" },
  { label: "Bleu", value: "#2563EB", class: "text-blue-600" },
  { label: "Vert", value: "#22C55E", class: "text-emerald-600" },
  { label: "Orange", value: "#F59E0B", class: "text-orange-600" },
];

export function RichTextField({
  value = "",
  onChange,
  placeholder = "Commencez à écrire...",
  name,
  className,
  editable = true,
  readOnly = false,
}: RichTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: value || "",
    editable: editable && !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      setShowColorPicker(false);
    },
    editorProps: {
      attributes: {
        "data-gramm": "false",
        "data-gramm_editor": "false",
        class: cn(
          "prose prose-base max-w-none focus:outline-none",
          "prose-headings:font-semibold",
          "prose-p:my-2 prose-p:leading-relaxed prose-p:text-sm prose-p:leading-[1.6]",
          "prose-ul:my-2 prose-ul:pl-6",
          "prose-ol:my-2 prose-ol:pl-6",
          "prose-li:my-1 prose-li:text-sm prose-li:leading-[1.6]",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-em:text-foreground prose-em:italic",
          "prose-u:underline",
          "min-h-[120px] p-4 text-sm leading-[1.6]"
        ),
      },
    },
  });

  // Mettre à jour le contenu si value change de l'extérieur
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Gérer le clic en dehors du color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  if (!editor) {
    return null;
  }

  const currentColor = editor.getAttributes("textStyle").color || null;

  // Mode lecture seule
  if (readOnly) {
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none",
          "prose-headings:font-semibold",
          "prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground",
          "prose-ul:my-2 prose-ul:pl-6 prose-ul:text-foreground",
          "prose-ol:my-2 prose-ol:pl-6 prose-ol:text-foreground",
          "prose-li:my-1",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-em:text-foreground prose-em:italic",
          "prose-u:underline",
          "p-4 rounded-lg bg-muted/30",
          className
        )}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    );
  }

  return (
    <div className={cn("relative space-y-2", className)}>
      {/* Input caché pour les formulaires */}
      {name && (
        <input type="hidden" name={name} value={editor.getHTML()} />
      )}

      {/* Toolbar - au-dessus de l'éditeur, jamais par-dessus le texte */}
      {isFocused && editable && (
        <div className="flex items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive("bold") && "bg-accent"
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive("italic") && "bg-accent"
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive("underline") && "bg-accent"
            )}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive("bulletList") && "bg-accent"
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive("orderedList") && "bg-accent"
            )}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="relative" ref={colorPickerRef}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0",
                currentColor && "bg-accent"
              )}
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette className="h-3.5 w-3.5" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover rounded-lg shadow-lg z-20">
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
        </div>
      )}

      {/* Éditeur - zone claire sans chevauchement */}
      <div
        className={cn(
          "rounded-lg bg-white border border-slate-300 transition-all duration-200 overflow-hidden",
          isFocused && "ring-2 ring-blue-500/30 ring-offset-1 bg-white shadow-sm border-blue-500",
          className?.includes("meeting-notes-editor") && "min-h-[400px]"
        )}
      >
        <div className="relative">
          <EditorContent editor={editor} />
          {!editor.getText() && !isFocused && (
            <div className="absolute top-4 left-4 text-sm text-slate-400 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour afficher du contenu riche en mode lecture seule
 */
export function RichTextDisplay({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  // Si le contenu est du texte brut (pas de HTML), le convertir en HTML simple
  const htmlContent = content && !content.trim().startsWith("<") 
    ? content.split("\n").map(line => `<p>${line}</p>`).join("")
    : content || "";

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold",
        "prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground",
        "prose-ul:my-2 prose-ul:pl-6 prose-ul:text-foreground",
        "prose-ol:my-2 prose-ol:pl-6 prose-ol:text-foreground",
        "prose-li:my-1",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground prose-em:italic",
        "prose-u:underline",
        "p-4 rounded-lg bg-muted/30 border border-border",
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

