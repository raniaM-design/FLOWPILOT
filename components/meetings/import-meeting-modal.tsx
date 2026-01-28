"use client";

import { useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, FileUp, Clipboard, X } from "lucide-react";
import { sanitizeMeetingText } from "@/lib/meetings/sanitize-text";
import { toast } from "sonner";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Configurer PDF.js worker (utiliser un CDN public)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface ImportMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (content: string) => void;
}

type ImportMode = "paste" | "word" | "pdf";

/**
 * Modal d'import de compte rendu avec 3 options :
 * - Coller du texte
 * - Importer un fichier Word (.docx)
 * - Importer un fichier PDF (.pdf)
 */
export function ImportMeetingModal({
  open,
  onOpenChange,
  onImport,
}: ImportMeetingModalProps) {
  const [mode, setMode] = useState<ImportMode>("paste");
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = () => {
    if (!pastedText.trim()) {
      toast.error("Veuillez coller du texte");
      return;
    }

    const cleaned = sanitizeMeetingText(pastedText);
    const htmlContent = convertTextToHtml(cleaned);
    onImport(htmlContent);
    handleClose();
  };

  const handleWordUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Veuillez sélectionner un fichier .docx");
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      // Mammoth génère déjà du HTML propre avec des balises <p>, <h1>, etc.
      // On nettoie uniquement les styles inline parasites mais on préserve la structure HTML
      let htmlContent = result.value;
      
      // Nettoyer les styles inline et attributs parasites tout en préservant les balises
      htmlContent = htmlContent
        // Enlever les styles inline
        .replace(/\s*style="[^"]*"/gi, "")
        // Enlever les classes parasites
        .replace(/\s*class="[^"]*"/gi, "")
        // Enlever les attributs de couleur/font
        .replace(/\s*(color|font-family|font-size|background-color)="[^"]*"/gi, "")
        // Normaliser les espaces dans les balises
        .replace(/>\s+</g, "><")
        .trim();
      
      // Si le HTML est vide après nettoyage, essayer d'extraire le texte brut
      if (!htmlContent || htmlContent === "<p></p>") {
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        const cleaned = sanitizeMeetingText(textResult.value);
        htmlContent = convertTextToHtml(cleaned);
      }
      
      onImport(htmlContent);
      toast.success("Fichier Word importé avec succès");
      handleClose();
    } catch (error) {
      console.error("Erreur lors de l'import Word:", error);
      toast.error("Erreur lors de l'import du fichier Word. Vérifiez que le fichier est valide.");
    } finally {
      setIsProcessing(false);
      // Réinitialiser l'input
      if (wordInputRef.current) {
        wordInputRef.current.value = "";
      }
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      toast.error("Veuillez sélectionner un fichier .pdf");
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = "";
      
      // Extraire le texte de chaque page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }

      // Nettoyer le texte extrait
      const cleaned = sanitizeMeetingText(fullText);
      const htmlContent = convertTextToHtml(cleaned);
      
      onImport(htmlContent);
      toast.success("Fichier PDF importé avec succès");
      handleClose();
    } catch (error) {
      console.error("Erreur lors de l'import PDF:", error);
      toast.error("Erreur lors de l'import du fichier PDF");
    } finally {
      setIsProcessing(false);
      // Réinitialiser l'input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    }
  };

  /**
   * Convertit le texte nettoyé en HTML pour TipTap
   * Crée des paragraphes à partir des lignes vides
   * Si le texte contient déjà du HTML valide, le préserve
   */
  const convertTextToHtml = (text: string): string => {
    if (!text.trim()) return "";
    
    // Si le texte contient déjà des balises HTML valides, le retourner tel quel
    // (cas où mammoth a déjà généré du HTML)
    if (text.includes("<p>") || text.includes("<div>") || text.includes("<h")) {
      // Nettoyer le HTML avec sanitizeMeetingText puis reconstruire
      const cleaned = sanitizeMeetingText(text);
      // Si après nettoyage il reste des balises, les préserver
      if (cleaned.includes("<")) {
        return cleaned;
      }
    }
    
    // Sinon, convertir le texte brut en HTML
    // Diviser par paragraphes (lignes vides)
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Convertir chaque paragraphe en <p>
    return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  };

  /**
   * Échappe les caractères HTML spéciaux
   */
  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const handleClose = () => {
    setPastedText("");
    setMode("paste");
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Importer un compte rendu
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choisissez une méthode d'import : coller du texte, importer un fichier Word (.docx) ou PDF (.pdf)
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélecteur de mode */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  mode === "paste"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }
              `}
            >
              <Clipboard className="h-4 w-4 inline mr-2" />
              Coller
            </button>
            <button
              type="button"
              onClick={() => setMode("word")}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  mode === "word"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }
              `}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Word (.docx)
            </button>
            <button
              type="button"
              onClick={() => setMode("pdf")}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  mode === "pdf"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }
              `}
            >
              <FileUp className="h-4 w-4 inline mr-2" />
              PDF (.pdf)
            </button>
          </div>

          {/* Mode : Coller */}
          {mode === "paste" && (
            <div className="space-y-4">
              <Label htmlFor="pasted-text">Collez votre texte ici</Label>
              <Textarea
                id="pasted-text"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Collez le contenu de votre compte rendu ici..."
                rows={10}
                className="font-mono text-sm"
              />
              <Button
                onClick={handlePaste}
                disabled={!pastedText.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Importer le texte
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Mode : Word */}
          {mode === "word" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <Label htmlFor="word-file" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Cliquez pour sélectionner un fichier .docx
                  </span>
                  <input
                    ref={wordInputRef}
                    id="word-file"
                    type="file"
                    accept=".docx"
                    onChange={handleWordUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </Label>
                <p className="text-sm text-slate-500 mt-2">
                  Le fichier sera converti en texte formaté
                </p>
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Conversion du fichier Word en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* Mode : PDF */}
          {mode === "pdf" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <FileUp className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <Label htmlFor="pdf-file" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Cliquez pour sélectionner un fichier .pdf
                  </span>
                  <input
                    ref={pdfInputRef}
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </Label>
                <p className="text-sm text-slate-500 mt-2">
                  Le texte sera extrait et formaté en paragraphes
                </p>
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extraction du texte PDF en cours...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isProcessing}>
            Annuler
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

