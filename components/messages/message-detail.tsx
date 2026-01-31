"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Sparkles, Megaphone, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export default function MessageDetail({ message }: { message: Message }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/messages");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ai_summary":
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case "product_announcement":
        return <Megaphone className="h-5 w-5 text-blue-600" />;
      case "team_message":
        return <Users className="h-5 w-5 text-green-600" />;
      default:
        return <Mail className="h-5 w-5 text-slate-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ai_summary":
        return "Résumé IA";
      case "product_announcement":
        return "Annonce produit";
      case "team_message":
        return "Message équipe";
      default:
        return type;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>

      {/* Message */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          {getTypeIcon(message.type)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{getTypeLabel(message.type)}</Badge>
              {message.isRead && (
                <span className="text-xs text-slate-500">Lu</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {message.subject}
            </h1>
            <p className="text-sm text-slate-500">
              Reçu le {formatTime(message.createdAt)}
            </p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none mt-6">
          <div className="whitespace-pre-wrap text-slate-700">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

