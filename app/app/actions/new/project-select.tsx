"use client";

import { useState } from "react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ProjectSelectProps {
  projects: Array<{ id: string; name: string }>;
  defaultValue?: string;
  /** Projet obligatoire par défaut */
  required?: boolean;
}

export function ProjectSelect({ projects, defaultValue, required = true }: ProjectSelectProps) {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || "");

  return (
    <div className="space-y-2">
      <Label htmlFor="projectId" className="flex items-center gap-2">
        Projet {required && <span className="text-red-500">*</span>}
      </Label>
      {projects.length === 0 ? (
        <>
          <input type="hidden" name="projectId" value="" required={required} />
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-sm text-amber-800 mb-2 font-medium">
              Aucun projet disponible
            </p>
            <p className="text-xs text-amber-700 mb-3">
              Vous devez créer un projet d&apos;abord pour continuer.
            </p>
            <Link href="/app/projects/new" className="text-xs text-amber-800 underline">
              Créer un projet
            </Link>
          </div>
        </>
      ) : (
        <>
          <Select 
            value={selectedValue} 
            onValueChange={setSelectedValue}
          >
            <SelectTrigger id="projectId">
              <SelectValue placeholder={required ? "Sélectionnez un projet *" : "Sélectionnez un projet (optionnel)"} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Input caché pour les Server Actions - required bloque la soumission si vide */}
          <input type="hidden" name="projectId" value={selectedValue || ""} required={required} />
        </>
      )}
    </div>
  );
}

