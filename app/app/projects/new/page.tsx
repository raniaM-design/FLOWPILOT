import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { createProject } from "../actions";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { ProjectFormClient } from "./project-form-client";
import { FolderPlus } from "lucide-react";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/20 relative overflow-hidden">
      {/* Effets de fond animés - couleurs cohérentes avec PILOTYS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cercles colorés flottants - bleu (projets) et émeraude (actions) */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        <div className="space-y-8">
          {/* En-tête avec icône et gradient - bleu PILOTYS */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg mb-4">
              <FolderPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-2">
                Nouveau projet
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Créez un nouveau projet pour organiser votre travail
              </p>
            </div>
          </div>

          {/* Formulaire avec design coloré - palette PILOTYS */}
          <FlowCard variant="default" className="bg-white border border-slate-200 shadow-lg relative overflow-hidden">
            {/* Bordure colorée animée - bleu PILOTYS */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            
            <FlowCardContent className="p-6 lg:p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Détails du projet
                </h2>
                <p className="text-sm text-slate-600">
                  Remplissez les informations de base pour créer votre projet
                </p>
              </div>

              <form action={createProject} className="space-y-6">
                {/* Nom du projet */}
                <div className="space-y-2 group">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-600" />
                    Nom du projet <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      placeholder="Mon nouveau projet"
                      required
                      className="h-11 border border-slate-300 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 group">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    Description
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Description du projet..."
                      rows={3}
                      className="border border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 resize-none transition-all duration-200"
                    />
                  </div>
                </div>
                
                {/* Champs Client et Équipe */}
                <ProjectFormClient />
                
                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <FormSubmitButton 
                    loadingText="Création..." 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 h-auto"
                  >
                    Créer le projet
                  </FormSubmitButton>
                  <Link href="/app/projects">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border border-slate-300 hover:bg-slate-50 font-medium px-6 py-2.5 h-auto"
                    >
                      Annuler
                    </Button>
                  </Link>
                </div>
              </form>
            </FlowCardContent>
          </FlowCard>
        </div>
      </div>
    </div>
  );
}
