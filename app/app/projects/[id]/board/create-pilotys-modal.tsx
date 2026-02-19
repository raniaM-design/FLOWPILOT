"use client";

/**
 * Modal pour créer une Action ou une Décision Pilotys depuis le board
 * Titre pré-rempli depuis le texte du post-it
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListTodo, CheckSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatePilotysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "action" | "decision";
  initialTitle: string;
  projectId: string;
}

export function CreatePilotysModal({
  open,
  onOpenChange,
  type,
  initialTitle,
  projectId,
}: CreatePilotysModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ projectId });
    if (title.trim()) params.set("title", title.trim());
    if (type === "action") {
      router.push(`/app/actions/new?${params.toString()}`);
    } else {
      router.push(`/app/decisions/new?${params.toString()}`);
    }
    onOpenChange(false);
  };

  const label = type === "action" ? "Action" : "Décision";
  const Icon = type === "action" ? ListTodo : CheckSquare2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "rounded-lg p-1.5",
                type === "action"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-purple-100 text-purple-600"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            Créer une {label} Pilotys
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="pilotys-title">Titre</Label>
            <Input
              id="pilotys-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Titre de ${label.toLowerCase()}...`}
              className="rounded-xl"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className={cn(
                "rounded-xl",
                type === "action"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              Ouvrir le formulaire
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
