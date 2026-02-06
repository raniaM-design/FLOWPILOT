"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface InviteCollaboratorProps {
  entityType: "action" | "decision" | "meeting";
  entityId: string;
  onInvite?: () => void;
  onInviteSuccess?: () => void; // Callback pour recharger la liste des collaborateurs
}

export function InviteCollaborator({
  entityType,
  entityId,
  onInvite,
  onInviteSuccess,
}: InviteCollaboratorProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/company/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des membres:", err);
    }
  };

  const handleInvite = async (memberId: string) => {
    setInviting(memberId);
    setError(null);
    setSuccess(null);

    try {
      const endpoint =
        entityType === "action"
          ? `/api/actions/${entityId}/invite`
          : entityType === "decision"
          ? `/api/decisions/${entityId}/invite`
          : `/api/meetings/${entityId}/invite`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId: memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'invitation");
      }

      const invitedMember = members.find((m) => m.id === memberId);
      const memberDisplayName = invitedMember?.name || invitedMember?.email.split("@")[0] || invitedMember?.email || "le collaborateur";
      setSuccess(`Invitation envoyée à ${memberDisplayName}`);
      setTimeout(() => setSuccess(null), 3000);
      if (onInvite) {
        onInvite();
      }
      // Notifier le parent pour recharger la liste des collaborateurs
      if (onInviteSuccess) {
        onInviteSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setInviting(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        Aucun membre disponible. Créez ou rejoignez une entreprise pour collaborer.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Inviter un collaborateur
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel>Membres de l'entreprise</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {members.map((member) => (
            <DropdownMenuItem
              key={member.id}
              onClick={() => handleInvite(member.id)}
              disabled={inviting === member.id}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{member.name || member.email.split("@")[0]}</span>
                <span className="text-xs text-slate-400">({member.email})</span>
              </div>
              {member.role !== "USER" && (
                <Badge variant="outline" className="text-xs">
                  {member.role}
                </Badge>
              )}
              {inviting === member.id && (
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

