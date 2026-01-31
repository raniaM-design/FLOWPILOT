"use client";

import { useState, useEffect } from "react";
import { Users, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Collaborator {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  inviterEmail?: string;
}

interface CollaboratorsListProps {
  entityType: "action" | "decision" | "meeting";
  entityId: string;
}

export function CollaboratorsList({ entityType, entityId }: CollaboratorsListProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborators();
  }, [entityType, entityId]);

  const fetchCollaborators = async () => {
    try {
      const endpoint =
        entityType === "action"
          ? `/api/actions/${entityId}/collaborators`
          : entityType === "decision"
          ? `/api/decisions/${entityId}/collaborators`
          : `/api/meetings/${entityId}/collaborators`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des collaborateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Chargement...</div>;
  }

  if (collaborators.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepté
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Users className="h-4 w-4" />
        <span>Collaborateurs invités</span>
      </div>
      <div className="space-y-2">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-sm text-slate-700">{collaborator.email}</span>
            </div>
            {getStatusBadge(collaborator.status)}
          </div>
        ))}
      </div>
    </div>
  );
}

