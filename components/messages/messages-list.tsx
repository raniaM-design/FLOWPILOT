"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCheck, Trash2, Sparkles, Megaphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function MessagesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">(
    (searchParams.get("filter") as "all" | "unread") || "all"
  );

  const fetchMessages = async (cursor?: string | null) => {
    try {
      const params = new URLSearchParams({
        limit: "20",
        filter,
      });
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await fetch(`/api/messages?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (cursor) {
          setMessages((prev) => [...prev, ...data.messages]);
        } else {
          setMessages(data.messages || []);
        }
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
  }, [filter]);

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/messages/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
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

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tous
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Non lus
          </Button>
        </div>
        {messages.some((m) => !m.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-200">
        {messages.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-600">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p>Aucun message</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer",
                !message.isRead && "bg-blue-50/50"
              )}
              onClick={() => router.push(`/messages/${message.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1">{getTypeIcon(message.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">
                        {getTypeLabel(message.type)}
                      </span>
                      {!message.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                      {message.subject}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {message.content.substring(0, 150)}
                      {message.content.length > 150 ? "..." : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(message.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charger plus */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => fetchMessages(nextCursor)}
            disabled={loading}
          >
            {loading ? "Chargement..." : "Charger plus"}
          </Button>
        </div>
      )}
    </div>
  );
}

