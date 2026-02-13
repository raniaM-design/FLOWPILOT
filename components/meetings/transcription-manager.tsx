"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface TranscriptionJob {
  id: string;
  status: "queued" | "processing" | "done" | "error";
  transcribedText: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  audioDeletedAt: Date | null;
  deletedAt: Date | null;
  consentRecording: boolean;
  consentProcessing: boolean;
  consentDate: Date | null;
}

interface TranscriptionManagerProps {
  meetingId: string;
  transcriptionJobs: TranscriptionJob[];
  isOwner: boolean;
}

export function TranscriptionManager({
  meetingId,
  transcriptionJobs,
  isOwner,
}: TranscriptionManagerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sanitizeEnabled, setSanitizeEnabled] = useState(false);

  // Filtrer les transcriptions supprimées (soft delete)
  const activeJobs = transcriptionJobs.filter((job) => !job.deletedAt);

  if (activeJobs.length === 0) {
    return null;
  }

  const handleDelete = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      const response = await fetch(`/api/transcriptions/${jobId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Transcription supprimée avec succès");
      // Recharger la page pour mettre à jour l'affichage
      window.location.reload();
    } catch (error) {
      console.error("Erreur suppression transcription:", error);
      toast.error("Erreur lors de la suppression de la transcription");
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setSelectedJobId(null);
    }
  };

  const sanitizeText = (text: string): string => {
    if (!sanitizeEnabled) return text;

    // Anonymiser emails
    text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email anonymisé]");
    
    // Anonymiser numéros de téléphone (format FR)
    text = text.replace(/\b0[1-9](?:[.\s-]?\d{2}){4}\b/g, "[téléphone anonymisé]");
    text = text.replace(/\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g, "[téléphone anonymisé]");
    
    // Anonymiser IBAN (format FR)
    text = text.replace(/\bFR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/gi, "[IBAN anonymisé]");
    
    // Anonymiser numéros de carte bancaire (16 chiffres)
    text = text.replace(/\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b/g, "[carte anonymisée]");

    return text;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En cours</Badge>;
      case "done":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Terminée</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-lg">Transcriptions audio</CardTitle>
          </div>
          {isOwner && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="sanitize"
                  checked={sanitizeEnabled}
                  onCheckedChange={setSanitizeEnabled}
                />
                <Label htmlFor="sanitize" className="text-sm cursor-pointer">
                  Anonymiser les données sensibles
                </Label>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeJobs.map((job) => (
          <div
            key={job.id}
            className="border border-slate-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.status)}
                  <span className="text-xs text-slate-500">
                    Créée le {new Date(job.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  {job.audioDeletedAt && (
                    <span className="text-xs text-green-600">
                      ✓ Audio supprimé
                    </span>
                  )}
                </div>

                {job.status === "done" && job.transcribedText && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Transcription :
                    </p>
                    <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {sanitizeText(job.transcribedText)}
                    </div>
                  </div>
                )}

                {job.status === "error" && job.errorMessage && (
                  <div className="mt-3">
                    <p className="text-sm text-red-600">{job.errorMessage}</p>
                  </div>
                )}

                {job.consentRecording && job.consentProcessing && (
                  <div className="mt-2 text-xs text-slate-500">
                    Consentements enregistrés le{" "}
                    {job.consentDate
                      ? new Date(job.consentDate).toLocaleDateString("fr-FR")
                      : "N/A"}
                  </div>
                )}
              </div>

              {isOwner && job.status === "done" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setShowDeleteDialog(true);
                  }}
                  disabled={deletingId === job.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingId === job.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la transcription ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est définitive. La transcription sera supprimée de manière permanente.
                Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedJobId && handleDelete(selectedJobId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

