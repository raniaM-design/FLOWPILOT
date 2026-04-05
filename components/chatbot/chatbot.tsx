"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ArrowRight, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useDisplayPreferences } from "@/contexts/display-preferences-context";

const TRUSTPILOT_URL =
  process.env.NEXT_PUBLIC_TRUSTPILOT_REVIEW_URL || "https://www.trustpilot.com/";

function newMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  kind?: "session_rating";
}

export interface ChatbotProps {
  userFirstName: string;
  overdueActionsCount: number;
  decisionsWithoutActionsThisMonth: number;
  proactiveAlertCount: number;
}

function buildPilotGreeting(
  name: string,
  late: number,
  noAction: number
): string {
  const safeName = name.trim() || "toi";
  if (late > 0) {
    return `${safeName}, tu as ${late} action${late > 1 ? "s" : ""} en retard : je suis Pilot pour t’aider à prioriser. Ouvre /app/actions?plan=overdue pour les traiter. Par quelle action tu commences ?`;
  }
  if (noAction > 5) {
    return `${safeName}, tu as ${noAction} décisions sans actions ce mois-ci : passons-les en tâches concrètes. Va sur /app/decisions ou ouvre un projet pour les lier. Tu veux que je te guide sur la première ?`;
  }
  return `${safeName}, tout semble calme côté alertes. Utilise /app/meetings/new ou /app/actions/new selon ton besoin. Tu préfères une réunion ou une action ?`;
}

type QuickReply = { label: string; href?: string; sendMessage?: string };

type FeedbackRowState =
  | "idle"
  | "positive_fill"
  | "positive_fade"
  | "gone"
  | "neg_form"
  | "neg_thanks";

type SessionUi = {
  messageId: string;
  phase: "stars" | "trustpilot" | "low_form" | "done";
  stars?: number;
  hoverStar?: number;
  lowComment?: string;
};

export function Chatbot({
  userFirstName,
  overdueActionsCount,
  decisionsWithoutActionsThisMonth,
  proactiveAlertCount: _initialProactiveSum,
}: ChatbotProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { preferences } = useDisplayPreferences();
  const reduceMotion = preferences.reduceAnimations;

  const [liveOverdue, setLiveOverdue] = useState(overdueActionsCount);
  const [liveDecisionsNoAction, setLiveDecisionsNoAction] = useState(
    decisionsWithoutActionsThisMonth
  );

  useEffect(() => {
    setLiveOverdue(overdueActionsCount);
    setLiveDecisionsNoAction(decisionsWithoutActionsThisMonth);
  }, [overdueActionsCount, decisionsWithoutActionsThisMonth]);

  const refreshPilotCounts = useCallback(() => {
    fetch("/api/user/pilot-alerts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { overdueActions?: number; decisionsWithoutActionsThisMonth?: number } | null) => {
        if (!data || typeof data.overdueActions !== "number") return;
        setLiveOverdue(data.overdueActions);
        setLiveDecisionsNoAction(data.decisionsWithoutActionsThisMonth ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPilotCounts();
  }, [pathname, refreshPilotCounts]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refreshPilotCounts();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshPilotCounts]);

  useEffect(() => {
    const onRefresh = () => refreshPilotCounts();
    window.addEventListener("pilotys-pilot-counts-refresh", onRefresh);
    return () =>
      window.removeEventListener("pilotys-pilot-counts-refresh", onRefresh);
  }, [refreshPilotCounts]);

  const liveProactive = liveOverdue + liveDecisionsNoAction;

  const greetingText = useMemo(
    () =>
      buildPilotGreeting(
        userFirstName,
        liveOverdue,
        liveDecisionsNoAction
      ),
    [userFirstName, liveOverdue, liveDecisionsNoAction]
  );

  const quickReplies: QuickReply[] = useMemo(() => {
    if (liveOverdue > 0) {
      return [
        { label: "Voir mes retards", href: "/app/actions?plan=overdue" },
        { label: "Créer une action rapide", href: "/app/actions/new" },
        { label: "Analyser une réunion", href: "/app/meetings/new" },
      ];
    }
    return [
      { label: "Nouvelle réunion", href: "/app/meetings/new" },
      { label: "Résumé de la semaine", href: "/app/review/weekly" },
      {
        label: "Aide",
        sendMessage: "Comment utiliser Pilotys ? Que peux-tu faire pour moi ?",
      },
    ];
  }, [liveOverdue]);

  const [isOpen, setIsOpen] = useState(false);
  const [panelEnter, setPanelEnter] = useState(false);
  const [triggerEnter, setTriggerEnter] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: greetingText,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendPressed, setSendPressed] = useState(false);
  const [timestampsVisible, setTimestampsVisible] = useState(false);
  const [feedbackRow, setFeedbackRow] = useState<Record<string, FeedbackRowState>>(
    {}
  );
  const [negDraft, setNegDraft] = useState<Record<string, string>>({});
  const [sessionUi, setSessionUi] = useState<SessionUi | null>(null);

  const sessionRatingAddedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "welcome" ? { ...m, content: greetingText } : m
      )
    );
  }, [greetingText]);

  useEffect(() => {
    setTimestampsVisible(true);
  }, []);

  useEffect(() => {
    const sr = messages.find((m) => m.kind === "session_rating");
    if (!sr) return;
    setSessionUi((prev) => {
      if (prev?.messageId === sr.id) return prev;
      return { messageId: sr.id, phase: "stars" };
    });
  }, [messages]);

  useEffect(() => {
    if (reduceMotion) {
      setTriggerEnter(true);
      return;
    }
    const id = requestAnimationFrame(() => setTriggerEnter(true));
    return () => cancelAnimationFrame(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (!isOpen) {
      setPanelEnter(false);
      return;
    }
    if (reduceMotion) {
      setPanelEnter(true);
      return;
    }
    const id = requestAnimationFrame(() => setPanelEnter(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen, reduceMotion]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, feedbackRow, sessionUi]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const historyForApi = useCallback((list: ChatMessage[]) => {
    return list
      .filter((m) => m.kind !== "session_rating")
      .map((m) => ({ role: m.role, content: m.content }));
  }, []);

  const sendChatMessage = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || isLoading) return;

      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      const historyPayload = historyForApi([...messages, userMessage]);

      setMessages((prev) => [...prev, userMessage]);
      if (rawText === undefined) setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.content,
            history: historyPayload,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'envoi du message");
        }

        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => {
          let next = [...prev, assistantMessage];
          const userCount = next.filter((m) => m.role === "user").length;
          if (userCount >= 3 && !sessionRatingAddedRef.current) {
            sessionRatingAddedRef.current = true;
            next = [
              ...next,
              {
                id: `session-rating-${newMessageId()}`,
                role: "assistant",
                content: "Comment s'est passé cet échange ?",
                timestamp: new Date(),
                kind: "session_rating",
              },
            ];
          }
          return next;
        });
      } catch (error) {
        console.error("Erreur chatbot:", error);
        const errorMessage: ChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          timestamp: new Date(),
        };
        setMessages((prev) => {
          let next = [...prev, errorMessage];
          const userCount = next.filter((m) => m.role === "user").length;
          if (userCount >= 3 && !sessionRatingAddedRef.current) {
            sessionRatingAddedRef.current = true;
            next = [
              ...next,
              {
                id: `session-rating-${newMessageId()}`,
                role: "assistant",
                content: "Comment s'est passé cet échange ?",
                timestamp: new Date(),
                kind: "session_rating",
              },
            ];
          }
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, historyForApi]
  );

  const handleSend = () => {
    void sendChatMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onQuickReply = (q: QuickReply) => {
    if (q.href) {
      router.push(q.href);
      setIsOpen(false);
      return;
    }
    if (q.sendMessage) {
      void sendChatMessage(q.sendMessage);
    }
  };

  const postMessageFeedback = useCallback(
    async (payload: {
      messageId: string;
      rating: "positive" | "negative";
      comment?: string;
      messageContent: string;
    }) => {
      try {
        await fetch("/api/bot/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error("[bot feedback]", e);
      }
    },
    []
  );

  const onThumbsUp = (messageId: string, messageContent: string) => {
    setFeedbackRow((s) => ({ ...s, [messageId]: "positive_fill" }));
    void postMessageFeedback({
      messageId,
      rating: "positive",
      messageContent,
    });
    window.setTimeout(() => {
      setFeedbackRow((s) => ({ ...s, [messageId]: "positive_fade" }));
    }, 120);
    window.setTimeout(() => {
      setFeedbackRow((s) => ({ ...s, [messageId]: "gone" }));
    }, 120 + 200);
  };

  const onThumbsDownOpen = (messageId: string) => {
    setFeedbackRow((s) => ({ ...s, [messageId]: "neg_form" }));
  };

  const onThumbsDownIgnore = (messageId: string) => {
    setFeedbackRow((s) => ({ ...s, [messageId]: "idle" }));
    setNegDraft((d) => {
      const n = { ...d };
      delete n[messageId];
      return n;
    });
  };

  const onThumbsDownSubmit = async (messageId: string, messageContent: string) => {
    const comment = (negDraft[messageId] ?? "").trim();
    if (!comment) return;
    await postMessageFeedback({
      messageId,
      rating: "negative",
      comment,
      messageContent,
    });
    setFeedbackRow((s) => ({ ...s, [messageId]: "neg_thanks" }));
    setNegDraft((d) => {
      const n = { ...d };
      delete n[messageId];
      return n;
    });
    window.setTimeout(() => {
      setFeedbackRow((s) => ({ ...s, [messageId]: "gone" }));
    }, 2000);
  };

  const postSessionRating = useCallback(
    async (stars: number, comment?: string) => {
      try {
        await fetch("/api/bot/session-rating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stars, comment: comment || undefined }),
        });
      } catch (e) {
        console.error("[session-rating]", e);
      }
    },
    []
  );

  const onStarClick = async (n: number) => {
    if (!sessionUi || sessionUi.phase !== "stars") return;
    if (n >= 4) {
      await postSessionRating(n);
      setSessionUi((p) =>
        p ? { ...p, phase: "trustpilot", stars: n, hoverStar: undefined } : p
      );
    } else {
      setSessionUi((p) =>
        p ? { ...p, phase: "low_form", stars: n, hoverStar: undefined } : p
      );
    }
  };

  const onLowSessionSubmit = async () => {
    if (!sessionUi?.stars) return;
    const c = (sessionUi.lowComment ?? "").trim();
    await postSessionRating(sessionUi.stars, c || undefined);
    setSessionUi((p) => (p ? { ...p, phase: "done" } : p));
  };

  const showQuickReplies = input.trim().length === 0;
  const badgeText = liveProactive > 99 ? "99+" : String(liveProactive);

  const triggerScaleClass = reduceMotion
    ? "scale-100"
    : triggerEnter
      ? "scale-100"
      : "scale-0";
  const triggerTransition = reduceMotion
    ? ""
    : "transition-transform duration-200 ease-out";

  const panelMotionClass = reduceMotion
    ? "opacity-100 translate-y-0"
    : panelEnter
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-4";

  const panelTransition = reduceMotion
    ? ""
    : "transition-[opacity,transform] duration-[220ms] ease-out";

  const renderSessionRatingBlock = (message: ChatMessage) => {
    if (!sessionUi || sessionUi.messageId !== message.id) return null;
    const fillUpTo =
      sessionUi.phase === "stars"
        ? sessionUi.hoverStar ?? sessionUi.stars ?? 0
        : sessionUi.stars ?? 0;

    return (
      <div className="mt-3 space-y-3">
        {sessionUi.phase === "stars" && (
          <div
            className="flex gap-0.5"
            onMouseLeave={() =>
              setSessionUi((p) => (p ? { ...p, hoverStar: undefined } : p))
            }
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="cursor-pointer text-[20px] leading-none transition-colors duration-100"
                style={{
                  color: star <= fillUpTo ? "#f59e0b" : "#e2e8f0",
                }}
                onMouseEnter={() =>
                  setSessionUi((p) =>
                    p && p.phase === "stars" ? { ...p, hoverStar: star } : p
                  )
                }
                onClick={() => void onStarClick(star)}
                aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        )}

        {sessionUi.phase === "trustpilot" && (
          <p className="text-[13px] leading-relaxed text-[#1a1a2e]">
            Super ! Tu peux partager un avis sur{" "}
            <a
              href={TRUSTPILOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1a56db] underline"
            >
              Trustpilot
            </a>{" "}
            😊
          </p>
        )}

        {sessionUi.phase === "low_form" && (
          <div className="space-y-2">
            <p className="text-[12px] text-[#64748b]">
              Qu&apos;est-ce qu&apos;on peut améliorer ?
            </p>
            <input
              type="text"
              value={sessionUi.lowComment ?? ""}
              onChange={(e) =>
                setSessionUi((p) =>
                  p ? { ...p, lowComment: e.target.value } : p
                )
              }
              placeholder="Ton retour…"
              className="w-full rounded-lg border border-[#e8ecf4] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#1a56db]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md bg-[#1a56db] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#1648c8]"
                onClick={() => void onLowSessionSubmit()}
              >
                Envoyer
              </button>
            </div>
          </div>
        )}

        {sessionUi.phase === "done" && (
          <p className="text-[12px] text-[#16a34a]">Merci pour ton retour ✓</p>
        )}
      </div>
    );
  };

  const renderAssistantFeedback = (message: ChatMessage) => {
    if (message.id === "welcome" || message.kind === "session_rating") {
      return null;
    }
    const st = feedbackRow[message.id] ?? "idle";
    if (st === "gone" || st === "neg_thanks") return null;

    return (
      <div className="mt-1 flex max-w-[85%] flex-col items-start">
        {st === "idle" || st === "positive_fill" || st === "positive_fade" ? (
          <div
            className={`flex items-center gap-2 transition-opacity duration-200 ease-out ${
              st === "positive_fade" ? "opacity-0" : "opacity-100"
            }`}
          >
            <button
              type="button"
              aria-label="Utile"
              disabled={st === "positive_fill" || st === "positive_fade"}
              onClick={() => onThumbsUp(message.id, message.content)}
              className="text-[#cbd5e1] transition-colors hover:text-[#1a56db] disabled:pointer-events-none"
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${
                  st === "positive_fill" || st === "positive_fade"
                    ? "fill-[#1a56db] text-[#1a56db]"
                    : ""
                }`}
                strokeWidth={2}
              />
            </button>
            {st === "idle" && (
              <button
                type="button"
                aria-label="Pas utile"
                onClick={() => onThumbsDownOpen(message.id)}
                className="text-[#cbd5e1] transition-colors hover:text-[#ef4444]"
              >
                <ThumbsDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        ) : null}

        <div
          className="grid w-full transition-[grid-template-rows] duration-200 ease-out"
          style={{
            gridTemplateRows: st === "neg_form" ? "1fr" : "0fr",
          }}
        >
          <div className="min-h-0 overflow-hidden">
            {st === "neg_form" && (
              <div className="mt-2 space-y-2 pt-1">
                <input
                  type="text"
                  value={negDraft[message.id] ?? ""}
                  onChange={(e) =>
                    setNegDraft((d) => ({
                      ...d,
                      [message.id]: e.target.value,
                    }))
                  }
                  placeholder={"Qu\u2019est-ce qui n\u2019allait pas ?"}
                  className="w-full rounded-lg border border-[#e8ecf4] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#1a56db]"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-[#1a56db] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#1648c8]"
                    onClick={() =>
                      void onThumbsDownSubmit(message.id, message.content)
                    }
                  >
                    Envoyer
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1 text-[12px] font-medium text-[#64748b] hover:bg-slate-100"
                    onClick={() => onThumbsDownIgnore(message.id)}
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {!isOpen && (
        <div
          className={`fixed z-[100] right-6 bottom-20 md:bottom-6 group ${triggerTransition}`}
        >
          <span
            className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-600 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 md:block"
            role="tooltip"
          >
            Pilot — ton assistant
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le chat Pilot"
            className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1a56db] text-white shadow-[0_4px_12px_rgba(26,86,219,0.35)] md:hover:scale-[1.08] active:scale-95 ${triggerScaleClass} ${triggerTransition}`}
            style={{ borderRadius: "50%" }}
          >
            <span
              className="text-[22px] font-bold leading-none text-white"
              aria-hidden
            >
              P
            </span>
            {liveProactive > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
                aria-label={`${liveProactive} alertes`}
              >
                {badgeText}
              </span>
            )}
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`fixed z-[100] flex max-h-[85vh] w-screen flex-col overflow-hidden bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] md:right-6 md:bottom-6 md:left-auto md:h-[520px] md:max-h-none md:w-[360px] md:rounded-2xl inset-x-0 bottom-0 left-0 rounded-t-[20px] ${panelMotionClass} ${panelTransition}`}
          role="dialog"
          aria-label="Chat Pilot"
        >
          <header className="flex h-[60px] shrink-0 items-center justify-between bg-[#1a56db] px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[18px] font-bold text-[#1a56db]"
                style={{ border: "2px solid rgba(255,255,255,0.4)" }}
                aria-hidden
              >
                P
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-white">
                  Pilot
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] text-white">
                  <span className="chatbot-pulse-dot shrink-0" />
                  <span>En ligne</span>
                  <span className="opacity-75">· Assistant Pilotys</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="shrink-0 p-1 text-white/80 transition-opacity hover:opacity-100"
              aria-label="Fermer le chat"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </header>

          <div
            className="chatbot-messages-scroll flex flex-1 flex-col overflow-y-auto bg-[#f8faff] p-4"
            style={{ padding: "16px" }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {message.kind === "session_rating" ? (
                  <>
                    <div className="max-w-[85%] rounded-[0_12px_12px_0] border border-[#e8ecf4] border-l-4 border-l-[#2563EB] bg-white px-[14px] py-3 text-[13px] leading-[1.6] text-[#1a1a2e]">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {renderSessionRatingBlock(message)}
                    </div>
                    <p
                      className={`mt-1 min-h-[14px] text-[10px] text-[#9ca3af] text-left`}
                    >
                      {timestampsVisible
                        ? message.timestamp.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "\u00a0"}
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[85%] rounded-[12px] bg-[#1a56db] px-[14px] py-3 text-[13px] leading-[1.6] text-white"
                          : "max-w-[85%] rounded-[0_12px_12px_0] border border-[#e8ecf4] border-l-4 border-l-[#2563EB] bg-white px-[14px] py-3 text-[13px] leading-[1.6] text-[#1a1a2e]"
                      }
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.role === "assistant" &&
                        feedbackRow[message.id] === "neg_thanks" && (
                          <p className="mt-2 text-[11px] text-[#16a34a]">
                            Merci, c&apos;est noté ✓
                          </p>
                        )}
                    </div>
                    <p
                      className={`mt-1 min-h-[14px] text-[10px] text-[#9ca3af] ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {timestampsVisible
                        ? message.timestamp.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "\u00a0"}
                    </p>
                    {message.role === "assistant" &&
                      renderAssistantFeedback(message)}
                  </>
                )}
              </div>
            ))}

            {showQuickReplies && messages.length === 1 && messages[0]?.id === "welcome" && (
              <div className="-mt-1 mb-2 flex flex-wrap gap-2">
                {quickReplies.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => onQuickReply(q)}
                    disabled={isLoading}
                    className="rounded-[20px] border border-solid border-[#1a56db] bg-[#f0f5ff] px-[14px] py-1.5 text-left text-[12px] font-medium text-[#1a56db] transition-colors hover:bg-[#1a56db] hover:text-white disabled:opacity-50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="mb-3 flex flex-col items-start">
                <div className="max-w-[85%] rounded-[0_12px_12px_0] border border-[#e8ecf4] border-l-4 border-l-[#2563EB] bg-white px-[14px] py-3">
                  <div className="typing flex items-center gap-1">
                    <span className="chatbot-typing-dot" />
                    <span className="chatbot-typing-dot" />
                    <span className="chatbot-typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-[#e8ecf4] bg-white px-4 py-3">
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-[24px] border-0 bg-[#f1f5f9] px-4 py-2.5 text-[13px] text-[#1a1a2e] outline-none placeholder:text-slate-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => {
                  if (!input.trim() || isLoading) return;
                  setSendPressed(true);
                  window.setTimeout(() => setSendPressed(false), 100);
                  handleSend();
                }}
                disabled={!input.trim() || isLoading}
                aria-label="Envoyer"
                className={`ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a56db] text-white transition-transform duration-100 hover:bg-[#1648c8] disabled:cursor-not-allowed disabled:opacity-40 ${
                  sendPressed ? "scale-[0.92]" : "scale-100"
                }`}
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
