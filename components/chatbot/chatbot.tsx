"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Headset, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Bonjour ! Je suis l'assistant PILOTYS. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur chatbot:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Bouton flottant - Robot support avec casque téléphonique */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white"
          aria-label="Ouvrir le chatbot"
        >
          <span className="relative flex items-center justify-center">
            <Bot className="h-6 w-6" strokeWidth={2.5} />
            <Headset className="h-5 w-5 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
          </span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/25 flex flex-col border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* En-tête - visible, harmonie avec la marque */}
          <div className="bg-[hsl(var(--brand))] p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar du bot - fond blanc pour contraste maximal, icône marque */}
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-lg border border-white/50">
                <span className="relative block text-[hsl(var(--brand))]">
                  <Bot className="h-6 w-6" strokeWidth={2.5} />
                  <Headset className="h-4 w-4 absolute -top-0.5 -right-0.5" strokeWidth={2.5} />
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Assistant PILOTYS</h3>
                <p className="text-sm text-white/95 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse border border-white" />
                  En ligne
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/25 rounded-full p-2 transition-colors border border-white/30"
              aria-label="Fermer le chatbot"
            >
              <X className="h-5 w-5 text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-400/30 shadow-md">
                    <span className="relative">
                      <Bot className="h-5 w-5 text-white" strokeWidth={2.5} />
                      <Headset className="h-3 w-3 absolute -top-1 -right-1 text-blue-200" strokeWidth={2.5} />
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 shadow-sm ${
                    message.role === "user"
                      ? "bg-[hsl(var(--brand))] text-white"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user" ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[hsl(var(--brand))]/10 flex items-center justify-center border-2 border-[hsl(var(--brand))]/30">
                    <User className="h-5 w-5 text-[hsl(var(--brand))]" strokeWidth={2} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[hsl(var(--brand))] flex items-center justify-center border-2 border-white/30 shadow-md">
                  <span className="relative block text-white">
                    <Bot className="h-5 w-5" strokeWidth={2.5} />
                    <Headset className="h-3 w-3 absolute -top-1 -right-1 text-blue-100" strokeWidth={2.5} />
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-white rounded-xl px-4 shadow-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

