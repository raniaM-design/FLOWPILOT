"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Users, CheckSquare, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PendingInvitation {
  id: string;
  type: "action" | "decision" | "meeting";
  entityId: string;
  entityTitle: string;
  inviterEmail: string;
  createdAt: string;
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations/pending");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des invitations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, type: string, response: "accept" | "decline") => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, response }),
      });

      if (res.ok) {
        // Retirer l'invitation de la liste
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      }
    } catch (err) {
      console.error("Erreur lors de la réponse:", err);
    }
  };

  const getEntityUrl = (type: string, entityId: string) => {
    switch (type) {
      case "action":
        return `/app/actions?actionId=${entityId}`;
      case "decision":
        return `/app/decisions/${entityId}`;
      case "meeting":
        return `/app/meetings/${entityId}`;
      default:
        return "/app";
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "action":
        return <CheckSquare className="h-4 w-4" />;
      case "decision":
        return <Target className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case "action":
        return "Action";
      case "decision":
        return "Décision";
      case "meeting":
        return "Réunion";
      default:
        return type;
    }
  };

  if (loading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
        <Bell className="h-4 w-4 text-blue-600" />
        <span>Invitations en attente</span>
      </div>
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-start justify-between p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getEntityIcon(invitation.type)}
              <Badge variant="outline" className="text-xs">
                {getEntityLabel(invitation.type)}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-900 mb-1">{invitation.entityTitle}</p>
            <p className="text-xs text-slate-600">
              Invité par {invitation.inviterEmail}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRespond(invitation.id, invitation.type, "accept")}
              className="h-8 px-3"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Accepter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRespond(invitation.id, invitation.type, "decline")}
              className="h-8 px-3 text-red-600 hover:text-red-700"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

