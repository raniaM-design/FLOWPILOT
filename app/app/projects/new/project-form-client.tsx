"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectFormClient() {
  const [client, setClient] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState("");

  const addTeamMember = () => {
    if (newMember.trim() && !teamMembers.includes(newMember.trim())) {
      setTeamMembers([...teamMembers, newMember.trim()]);
      setNewMember("");
    }
  };

  const removeTeamMember = (member: string) => {
    setTeamMembers(teamMembers.filter((m) => m !== member));
  };

  return (
    <>
      {/* Champ Client */}
      <div className="space-y-2">
        <Label htmlFor="client">Client</Label>
        <Input
          id="client"
          name="client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Nom du client"
        />
      </div>

      {/* Champ Équipe */}
      <div className="space-y-2">
        <Label htmlFor="team">Équipe</Label>
        <div className="flex gap-2">
          <Input
            id="team"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTeamMember();
              }
            }}
            placeholder="Email ou nom du membre"
          />
          <button
            type="button"
            onClick={addTeamMember}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Ajouter
          </button>
        </div>
        {teamMembers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm"
              >
                <span>{member}</span>
                <button
                  type="button"
                  onClick={() => removeTeamMember(member)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="hidden"
          name="teamMembers"
          value={JSON.stringify(teamMembers)}
        />
      </div>
    </>
  );
}

