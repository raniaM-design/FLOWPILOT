"use client";

import { useState } from "react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ProjectSelectProps {
  projects: Array<{ id: string; name: string }>;
  defaultValue?: string;
}

export function ProjectSelect({ projects, defaultValue }: ProjectSelectProps) {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || "");

  return (
    <div className="space-y-2">
      <Label htmlFor="projectId">Projet {projects.length > 0 ? "(optionnel)" : ""}</Label>
      {projects.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm text-amber-800 mb-2 font-medium">
            Aucun projet disponible
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Vous pouvez créer une réunion sans projet, ou créer un projet d'abord.
          </p>
          <Link href="/app/projects/new" className="text-xs text-amber-800 underline">
            Créer un projet
          </Link>
        </div>
      ) : (
        <>
          <Select 
            value={selectedValue} 
            onValueChange={setSelectedValue}
          >
            <SelectTrigger id="projectId">
              <SelectValue placeholder="Sélectionner un projet (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Input caché pour les Server Actions */}
          <input type="hidden" name="projectId" value={selectedValue || ""} />
        </>
      )}
    </div>
  );
}

