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
import { Loader2, FileText, FileUp, Clipboard, X, Mic, Shield, Info, Lock, Users, Clock, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
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
  meetingId?: string; // Optionnel : si fourni, utilise le système async avec jobs
}

type ImportMode = "paste" | "word" | "pdf" | "audio";

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
  meetingId,
}: ImportMeetingModalProps) {
  const [mode, setMode] = useState<ImportMode>("paste");
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<string>("");
  const [transcriptionJobId, setTranscriptionJobId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  // Consentements légaux
  const [consentRecording, setConsentRecording] = useState(false);
  const [consentProcessing, setConsentProcessing] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier les consentements obligatoires
    if (!consentRecording || !consentProcessing) {
      toast.error("Veuillez accepter les conditions de consentement pour continuer");
      return;
    }

    // Vérifier le type de fichier
    const allowedExtensions = [".mp3", ".wav", ".webm", ".ogg", ".m4a", ".mp4"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension) && !file.type.startsWith("audio/")) {
      toast.error("Veuillez sélectionner un fichier audio valide (MP3, WAV, WebM, OGG, M4A)");
      return;
    }

    // Vérifier la taille (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast.error("Le fichier audio est trop volumineux. Taille maximale : 25MB");
      return;
    }

    setIsProcessing(true);
    setTranscriptionProgress("Envoi du fichier audio...");

    try {
      // Si meetingId est fourni, utiliser le système async avec jobs
      if (meetingId) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        setTranscriptionProgress("Démarrage de la transcription...");
        
        // Appeler l'action serveur pour démarrer le job
        const response = await fetch("/api/meetings/start-transcription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            // Envoyer le fichier en base64 pour simplifier
            audioBase64: arrayBufferToBase64(arrayBuffer),
            // Consentements légaux
            consentRecording,
            consentProcessing,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
          toast.error(errorData.error || "Erreur lors du démarrage de la transcription");
          return;
        }

        const data = await response.json();
        setTranscriptionJobId(data.transcriptionJobId);
        setTranscriptionProgress("Transcription en cours...");

        // Démarrer le polling
        startPolling(data.transcriptionJobId);
      } else {
        // Mode synchrone (ancien système) pour les nouvelles réunions
        const formData = new FormData();
        formData.append("audio", file);

        setTranscriptionProgress("Transcription de l'audio en cours...");
        const response = await fetch("/api/meetings/transcribe-audio", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
          
          if (errorData.requiresAPIKey) {
            toast.error("La transcription audio nécessite une clé API. Configurez HUGGINGFACE_API_KEY (gratuit) ou OPENAI_API_KEY dans vos variables d'environnement.");
          } else {
            toast.error(errorData.error || "Erreur lors de la transcription de l'audio");
          }
          return;
        }

        setTranscriptionProgress("Amélioration du compte rendu...");
        const data = await response.json();

        if (!data.improvedText) {
          toast.error("Aucun texte n'a été généré depuis l'audio");
          return;
        }

        // Convertir le texte amélioré en HTML
        const htmlContent = convertTextToHtml(data.improvedText);
        
        onImport(htmlContent);
        toast.success("Audio transcrit et compte rendu généré avec succès !");
        handleClose();
      }
    } catch (error) {
      console.error("Erreur lors de la transcription audio:", error);
      toast.error("Erreur lors de la transcription de l'audio. Vérifiez votre connexion et réessayez.");
      setIsProcessing(false);
      setTranscriptionProgress("");
    } finally {
      // Réinitialiser l'input
      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startPolling = (jobId: string) => {
    // Nettoyer l'interval précédent si existe
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/transcriptions/poll?transcriptionJobId=${jobId}`);
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du statut");
        }

        const data = await response.json();

        if (data.status === "done") {
          clearInterval(interval);
          setPollInterval(null);
          setIsProcessing(false);
          setTranscriptionProgress("");
          
          if (data.transcribedText) {
            const htmlContent = convertTextToHtml(data.transcribedText);
            onImport(htmlContent);
            toast.success("Audio transcrit avec succès !");
            handleClose();
          } else {
            toast.error("Aucun texte n'a été généré depuis l'audio");
          }
        } else if (data.status === "error") {
          clearInterval(interval);
          setPollInterval(null);
          setIsProcessing(false);
          setTranscriptionProgress("");
          toast.error(data.errorMessage || "Erreur lors de la transcription");
        } else {
          // Mettre à jour le message de progression
          if (data.status === "queued") {
            setTranscriptionProgress("En attente de traitement...");
          } else if (data.status === "processing") {
            setTranscriptionProgress("Transcription en cours...");
          }
        }
      } catch (error) {
        console.error("Erreur lors du polling:", error);
        // Continuer le polling même en cas d'erreur temporaire
      }
    }, 2000); // Poll toutes les 2 secondes

    setPollInterval(interval);
  };

  const handleClose = () => {
    // Nettoyer le polling si actif
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    
    setPastedText("");
    setMode("paste");
    setIsProcessing(false);
    setTranscriptionProgress("");
    setTranscriptionJobId(null);
    // Réinitialiser les consentements
    setConsentRecording(false);
    setConsentProcessing(false);
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
            Choisissez une méthode d'import : coller du texte, importer un fichier Word (.docx), PDF (.pdf) ou transcrire un audio (.mp3, .wav, etc.)
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
            <button
              type="button"
              onClick={() => setMode("audio")}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  mode === "audio"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }
              `}
            >
              <Mic className="h-4 w-4 inline mr-2" />
              Audio
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

          {/* Mode : Audio */}
          {mode === "audio" && (
            <div className="space-y-5">
              {/* Informations sur le traitement - Design amélioré */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-xl p-5 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1 text-base">
                        Traitement de l'audio et protection des données
                      </h3>
                      <p className="text-xs text-slate-600">
                        Vos données sont protégées et traitées en toute sécurité
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-900">Accès sécurisé</p>
                        <p className="text-xs text-slate-600 mt-0.5">Seul vous et les membres autorisés du projet ont accès à l'audio et à la transcription</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Lock className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-900">Traitement sécurisé</p>
                        <p className="text-xs text-slate-600 mt-0.5">L'audio est traité sur notre serveur Whisper sécurisé (Europe si configuré). Nous appliquons des mesures de sécurité et de confidentialité.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Clock className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-900">Conservation limitée</p>
                        <p className="text-xs text-slate-600 mt-0.5">L'audio est supprimé automatiquement après transcription (sous 24h). La transcription est conservée tant que le projet existe</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                      <Trash2 className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-900">Suppression à tout moment</p>
                        <p className="text-xs text-slate-600 mt-0.5">Vous pouvez supprimer l'audio et la transcription à tout moment depuis la page de la réunion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consentements obligatoires - Design amélioré */}
              <div className="space-y-4 border-2 border-slate-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-slate-900">Consentements obligatoires</p>
                </div>
                
                <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  consentRecording 
                    ? "border-green-200 bg-green-50/50" 
                    : "border-slate-200 bg-white"
                }`}>
                  <Checkbox
                    id="consent-recording"
                    checked={consentRecording}
                    onCheckedChange={(checked) => setConsentRecording(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent-recording" className="text-sm cursor-pointer flex-1">
                    <div className="flex items-start gap-1">
                      <span className="text-red-600 font-semibold">*</span>
                      <span className="font-medium text-slate-900">Je confirme avoir informé les participants et être autorisé(e) à enregistrer et transcrire cette réunion.</span>
                    </div>
                    <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 rounded-md border border-amber-100">
                      <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800">
                        <strong className="font-semibold">Je suis responsable</strong> d'informer les participants. Je ne dois pas uploader d'audio sans autorisation.
                      </p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  consentProcessing 
                    ? "border-green-200 bg-green-50/50" 
                    : "border-slate-200 bg-white"
                }`}>
                  <Checkbox
                    id="consent-processing"
                    checked={consentProcessing}
                    onCheckedChange={(checked) => setConsentProcessing(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent-processing" className="text-sm cursor-pointer flex-1">
                    <div className="flex items-start gap-1">
                      <span className="text-red-600 font-semibold">*</span>
                      <span className="font-medium text-slate-900">
                        J'accepte que PILOTYS traite cet audio et la transcription pour générer un compte rendu, conformément à la{" "}
                        <Link href="/legal/confidentialite" target="_blank" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                          politique de confidentialité
                        </Link>.
                      </span>
                    </div>
                  </Label>
                </div>
              </div>

              {/* Zone d'upload - Design amélioré */}
              <div className={`relative overflow-hidden border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                consentRecording && consentProcessing && !isProcessing
                  ? "border-blue-300 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:border-blue-400 hover:shadow-lg cursor-pointer"
                  : "border-slate-300 bg-slate-50 cursor-not-allowed"
              }`}>
                {consentRecording && consentProcessing && !isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 animate-pulse"></div>
                )}
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all ${
                    consentRecording && consentProcessing && !isProcessing
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-200 text-slate-400"
                  }`}>
                    <Mic className="h-8 w-8" />
                  </div>
                  <Label htmlFor="audio-file" className={`cursor-pointer block ${consentRecording && consentProcessing && !isProcessing ? "" : "cursor-not-allowed"}`}>
                    <p className={`text-base font-semibold mb-2 transition-colors ${
                      consentRecording && consentProcessing && !isProcessing
                        ? "text-blue-700 hover:text-blue-800"
                        : "text-slate-400"
                    }`}>
                      {consentRecording && consentProcessing && !isProcessing
                        ? "Cliquez pour sélectionner un fichier audio"
                        : "Acceptez les conditions ci-dessus pour continuer"}
                    </p>
                    <input
                      ref={audioInputRef}
                      id="audio-file"
                      type="file"
                      accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a"
                      onChange={handleAudioUpload}
                      className="hidden"
                      disabled={isProcessing || !consentRecording || !consentProcessing}
                    />
                  </Label>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-slate-600 font-medium">
                      Formats supportés : <span className="text-slate-900">MP3, WAV, WebM, OGG, M4A</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Taille maximale : <span className="font-semibold">25MB</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-slate-600">
                        L'audio sera transcrit et transformé en compte rendu professionnel
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-blue-600 font-medium">
                        Gratuit avec Hugging Face (configurez HUGGINGFACE_API_KEY)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {isProcessing && (
                <div className="space-y-3 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        {transcriptionProgress || "Traitement de l'audio en cours..."}
                      </p>
                      {transcriptionProgress && (
                        <p className="text-xs text-blue-700 mt-1">
                          Cela peut prendre quelques minutes selon la durée de l'audio
                        </p>
                      )}
                    </div>
                  </div>
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

