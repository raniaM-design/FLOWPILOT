"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserMentionInput } from "@/components/mentions/user-mention-input";
import { Building2, Users } from "lucide-react";

export function ProjectFormClient() {
  const [client, setClient] = useState("");
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);

  return (
    <>
      {/* Champ Client */}
      <div className="space-y-2 group">
        <Label htmlFor="client" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <Building2 className="h-4 w-4 text-blue-600" />
          Client
        </Label>
        <div className="relative">
          <Input
            id="client"
            name="client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Nom du client"
            className="h-12 border-2 border-slate-200 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/20 transition-all duration-200 pl-4 pr-4 text-base"
          />
          <div className="absolute inset-0 rounded-lg bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </div>

      {/* Champ Équipe avec système de mentions */}
      <div className="space-y-2 group">
        <Label htmlFor="team" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <Users className="h-4 w-4 text-emerald-600" />
          Équipe
        </Label>
        <div className="relative">
          <div className="border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 rounded-lg transition-all duration-200">
            <UserMentionInput
              value={teamMemberIds}
              onChange={setTeamMemberIds}
              placeholder="Tapez @email pour mentionner un membre de l'entreprise..."
            />
          </div>
          <div className="absolute inset-0 rounded-lg bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
        <input
          type="hidden"
          name="teamMemberIds"
          value={JSON.stringify(teamMemberIds)}
        />
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          Ajoutez les membres de votre entreprise qui travailleront sur ce projet
        </p>
      </div>
    </>
  );
}

