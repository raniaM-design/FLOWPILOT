"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCheck, Trash2, Sparkles, Megaphone, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export function MessagesDropdown() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages?limit=6");
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/messages/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du compteur:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();

    // Polling toutes les 30 secondes
    const interval = setInterval(() => {
      fetchMessages();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      const response = await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur lors du marquage:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/messages/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Erreur lors du marquage:", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const message = messages.find((m) => m.id === id);
        if (message && !message.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleClick = (message: Message) => {
    router.push(`/messages/${message.id}`);
    setOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ai_summary":
        return <Sparkles className="h-4 w-4" />;
      case "product_announcement":
        return <Megaphone className="h-4 w-4" />;
      case "team_message":
        return <Users className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ai_summary":
        return "Résumé IA";
      case "product_announcement":
        return "Annonce";
      case "team_message":
        return "Équipe";
      default:
        return type;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative text-[#667085] hover:text-[#111111] hover:bg-[#F1F5F9]"
        >
          <Mail className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#DC2626] flex items-center justify-center text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end" forceMount>
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="px-0">Messages</DropdownMenuLabel>
          {messages.some((m) => !m.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun message
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0",
                  !message.isRead && "bg-blue-50/50"
                )}
                onClick={() => handleClick(message)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(message.type)}
                      <span className="text-xs text-slate-500">
                        {getTypeLabel(message.type)}
                      </span>
                      {!message.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {message.subject}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {message.content.substring(0, 100)}
                      {message.content.length > 100 ? "..." : ""}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={(e) => handleDelete(message.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push("/messages");
            setOpen(false);
          }}
          className="cursor-pointer"
        >
          Voir tous les messages
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

