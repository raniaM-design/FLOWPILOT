import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProject } from "../actions";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { ProjectFormClient } from "./project-form-client";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau projet</h1>
        <p className="text-muted-foreground mt-2">
          Créez un nouveau projet pour organiser votre travail
        </p>
      </div>

      <div className="max-w-2xl bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold leading-none tracking-tight mb-2">
            Détails du projet
          </h2>
          <p className="text-sm text-muted-foreground">
            Remplissez les informations de base pour créer votre projet
          </p>
        </div>
        <form action={createProject} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Mon nouveau projet"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Description du projet..."
              rows={4}
            />
          </div>
          
          {/* Champs Client et Équipe */}
          <ProjectFormClient />
          
          <div className="flex gap-4 pt-4">
            <FormSubmitButton loadingText="Création...">
              Créer le projet
            </FormSubmitButton>
            <Link href="/app/projects">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
