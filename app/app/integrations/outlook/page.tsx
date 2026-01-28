"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FlowCard, FlowCardContent } from "@/components/ui/flow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ExternalLink, Calendar, Users, Clock, Loader2, ArrowRight, Settings, RefreshCw, AlertCircle } from "lucide-react";
import { OutlookEvent } from "@/lib/outlook/graph";

interface SyncResult {
  nbImported: number;
  nbUpdated: number;
  nbCancelled: number;
  nbSkipped?: number;
  totalFetched?: number;
}

export default function OutlookIntegrationPage() {
  const t = useTranslations("integrations.outlook");
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<OutlookEvent[]>([]);
  const [importedEvents, setImportedEvents] = useState<Set<string>>(new Set());
  const [importingEventId, setImportingEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ date: Date; result: SyncResult } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [outlookEmail, setOutlookEmail] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showChangeAccountWarning, setShowChangeAccountWarning] = useState(false);

  // Vérifier la connexion au chargement
  useEffect(() => {
    checkConnection();
  }, []);

  // Charger les événements quand la connexion est établie et que l'onglet change
  useEffect(() => {
    if (isConnected) {
      loadEvents();
    }
  }, [isConnected, activeTab]);

  // Gérer les paramètres d'URL (succès/erreur de connexion)
  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    
    if (connected === "1") {
      setIsConnected(true);
      setError(null);
      checkConnection(); // Re-vérifier pour charger les événements
    } else if (errorParam) {
      setError(t("connectionError"));
    }
  }, [searchParams, t]);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/outlook/status");
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected || false);
        setOutlookEmail(data.email || null);
        setLastSyncAt(data.lastSyncAt ? new Date(data.lastSyncAt) : null);
      } else {
        setIsConnected(false);
        setOutlookEmail(null);
        setLastSyncAt(null);
      }
    } catch (err) {
      setIsConnected(false);
      setOutlookEmail(null);
      setLastSyncAt(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = activeTab === "today"
        ? today.toISOString().split("T")[0]
        : new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const response = await fetch(`/api/outlook/events?from=${startDate}&to=${endDate}`);
      
      if (!response.ok) {
        throw new Error(t("error"));
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (eventId: string) => {
    setImportingEventId(eventId);
    setError(null);

    try {
      const response = await fetch("/api/outlook/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error(t("importError"));
      }

      const data = await response.json();
      setImportedEvents((prev) => new Set(prev).add(eventId));
    } catch (err: any) {
      setError(err.message || t("importError"));
    } finally {
      setImportingEventId(null);
    }
  };

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString("fr-FR", { 
      weekday: "short", 
      day: "numeric", 
      month: "short" 
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    setSyncError(null);

    try {
      const response = await fetch("/api/integrations/outlook/disconnect", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.message || errorData.error || t("disconnectError") || "Erreur lors de la déconnexion");
      }

      // Réinitialiser l'état
      setIsConnected(false);
      setOutlookEmail(null);
      setLastSyncAt(null);
      setLastSync(null);
      setEvents([]);
      setShowChangeAccountWarning(false);

      // Relancer immédiatement le flow de connexion si c'était un changement de compte
      if (showChangeAccountWarning) {
        window.location.href = "/api/outlook/connect";
      }
    } catch (err: any) {
      setError(err.message || t("disconnectError") || "Erreur lors de la déconnexion");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleChangeAccount = () => {
    setShowChangeAccountWarning(true);
  };

  const handleCancelChangeAccount = () => {
    setShowChangeAccountWarning(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setError(null);

    try {
      const response = await fetch("/api/integrations/outlook/sync?range=default", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        
        // Gestion des erreurs friendly
        if (response.status === 401) {
          setSyncError(t("syncErrorUnauthorized") || "Votre session a expiré. Veuillez vous reconnecter.");
        } else if (response.status === 403) {
          setSyncError(t("syncErrorForbidden") || "Vous n'avez pas les permissions nécessaires pour synchroniser Outlook.");
        } else if (response.status === 429) {
          setSyncError(t("syncErrorRateLimit") || "Trop de requêtes. Veuillez réessayer dans quelques instants.");
        } else {
          setSyncError(errorData.message || errorData.error || t("syncError") || "Erreur lors de la synchronisation");
        }
        return;
      }

      const data = await response.json();
      
      if (data.success && data.statistics) {
        setLastSync({
          date: new Date(),
          result: {
            nbImported: data.statistics.nbImported || 0,
            nbUpdated: data.statistics.nbUpdated || 0,
            nbCancelled: data.statistics.nbCancelled || 0,
            nbSkipped: data.statistics.nbSkipped || 0,
            totalFetched: data.statistics.totalFetched || 0,
          },
        });
        
        // Recharger les événements après sync
        if (isConnected) {
          loadEvents();
        }
      }
    } catch (err: any) {
      setSyncError(err.message || t("syncError") || "Erreur lors de la synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && !isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec breadcrumb et bouton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">{t("breadcrumb")}</div>
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            actions={!isConnected ? [{
              component: (
                <Button
                  onClick={() => {
                    window.location.href = "/api/outlook/connect";
                  }}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("connectAccount") || "Connecter un compte Outlook"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ),
              variant: "default"
            }] : undefined}
          />
        </div>
        {isConnected && (
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-emerald-600 text-white h-fit">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {t("connected")}
            </Badge>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              size="sm"
              variant="outline"
              className="h-fit"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("syncing") || "Synchronisation..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("syncNow") || "Synchroniser maintenant"}
                </>
              )}
            </Button>
            <Button
              onClick={handleChangeAccount}
              disabled={isSyncing || isDisconnecting}
              size="sm"
              variant="ghost"
              className="h-fit"
            >
              {t("changeAccount") || "Changer de compte Outlook"}
            </Button>
          </div>
        )}
      </div>

      {!isConnected ? (
        /* Page de connexion - Design inspiré de l'image */
        <FlowCard variant="default" className="border border-[#E5E7EB] shadow-sm">
          <FlowCardContent className="p-12">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Illustration centrale */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Calendrier bleu */}
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="h-16 w-16 text-white" />
                  </div>
                  {/* Logo Outlook superposé */}
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center border-2 border-blue-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">O</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Titre principal */}
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-[#111111]">
                  {t("mainTitle")}
                </h2>
                <p className="text-base text-[#667085] max-w-2xl mx-auto leading-relaxed">
                  {t("mainDescription")}
                </p>
              </div>

              {/* Deux boîtes de fonctionnalités */}
              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#111111] mb-2">
                        {t("feature1Title")}
                      </h3>
                      <p className="text-sm text-[#667085] leading-relaxed">
                        {t("feature1Description")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#111111] mb-2">
                        {t("feature2Title")}
                      </h3>
                      <p className="text-sm text-[#667085] leading-relaxed">
                        {t("feature2Description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section "Plus d'outils à venir" */}
              <div className="mt-12 pt-8 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Settings className="h-5 w-5 text-blue-500" />
                  <Settings className="h-5 w-5 text-blue-400" />
                  <Settings className="h-5 w-5 text-blue-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[#111111] mb-2">
                    {t("comingSoonTitle")}
                  </h3>
                  <p className="text-sm text-[#667085]">
                    {t("comingSoonDescription")}
                  </p>
                </div>
              </div>
            </div>
          </FlowCardContent>
        </FlowCard>
      ) : (
        /* Page avec événements - après connexion */
        <>
          {/* Warning changement de compte */}
          {showChangeAccountWarning && (
            <FlowCard variant="default" className="border border-[#FEF3C7] bg-[#FFFBEB] shadow-sm">
              <FlowCardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#D97706] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#92400E] mb-1">
                      {t("changeAccountWarningTitle") || "Changer de compte Outlook"}
                    </p>
                    <p className="text-sm text-[#92400E] mb-3">
                      {t("changeAccountWarningMessage") || "Le compte Outlook actuellement connecté sera déconnecté."}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        size="sm"
                        variant="default"
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                      >
                        {isDisconnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("disconnecting") || "Déconnexion..."}
                          </>
                        ) : (
                          t("confirmChangeAccount") || "Confirmer"
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelChangeAccount}
                        disabled={isDisconnecting}
                        size="sm"
                        variant="outline"
                      >
                        {t("cancel") || "Annuler"}
                      </Button>
                    </div>
                  </div>
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Section informations compte connecté */}
          {isConnected && outlookEmail && (
            <FlowCard variant="default" className="border border-[#E5E7EB] shadow-sm">
              <FlowCardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-foreground">
                      {t("connectedWith") || "Connecté avec"} : <span className="text-[#2563EB]">{outlookEmail}</span>
                    </span>
                  </div>
                  {lastSyncAt && (
                    <div className="flex items-center gap-2 pl-6">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t("lastSync") || "Dernière synchronisation"} : {formatDateShort(lastSyncAt)}
                      </span>
                    </div>
                  )}
                </div>
              </FlowCardContent>
            </FlowCard>
          )}

          {/* Section synchronisation */}
          {(lastSync || syncError) && (
            <FlowCard variant="default" className="border border-[#E5E7EB] shadow-sm">
              <FlowCardContent className="p-4">
                {syncError ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#DC2626] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#DC2626] mb-1">
                        {t("syncErrorTitle") || "Erreur de synchronisation"}
                      </p>
                      <p className="text-sm text-[#667085]">{syncError}</p>
                    </div>
                    <Button
                      onClick={() => setSyncError(null)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ) : lastSync ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-foreground">
                          {t("lastSync") || "Dernière synchronisation"} : {formatDateTime(lastSync.date)}
                        </span>
                      </div>
                    </div>
                    {lastSync.result.totalFetched !== undefined && lastSync.result.totalFetched > 0 && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pl-6">
                        {lastSync.result.nbImported > 0 && (
                          <span>
                            {lastSync.result.nbImported} {t("imported") || "importé(s)"}
                          </span>
                        )}
                        {lastSync.result.nbUpdated > 0 && (
                          <span>
                            {lastSync.result.nbUpdated} {t("updated") || "mis à jour"}
                          </span>
                        )}
                        {lastSync.result.nbCancelled > 0 && (
                          <span>
                            {lastSync.result.nbCancelled} {t("cancelled") || "annulé(s)"}
                          </span>
                        )}
                        {lastSync.result.nbSkipped !== undefined && lastSync.result.nbSkipped > 0 && (
                          <span>
                            {lastSync.result.nbSkipped} {t("skipped") || "ignoré(s)"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </FlowCardContent>
            </FlowCard>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "today" | "week")}>
            <TabsList>
              <TabsTrigger value="today">{t("today")}</TabsTrigger>
              <TabsTrigger value="week">{t("week")}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
                  <span className="ml-2 text-sm text-muted-foreground">{t("loading")}</span>
                </div>
              ) : error ? (
                <FlowCard variant="default">
                  <FlowCardContent className="py-12">
                    <div className="text-center text-destructive">
                      <p>{error}</p>
                      <Button
                        onClick={loadEvents}
                        variant="outline"
                        className="mt-4"
                      >
                        Réessayer
                      </Button>
                    </div>
                  </FlowCardContent>
                </FlowCard>
              ) : events.length === 0 ? (
                <FlowCard variant="default">
                  <FlowCardContent className="py-12">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {t("noEvents")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("noEventsDescription")}
                      </p>
                    </div>
                  </FlowCardContent>
                </FlowCard>
              ) : (
                <div className="space-y-4">
                  {events.map((event: OutlookEvent & { isImported?: boolean; meetingId?: string | null }) => {
                    const isImported = event.isImported || importedEvents.has(event.id);
                    const isImporting = importingEventId === event.id;
                    const meetingId = event.meetingId;

                    return (
                      <FlowCard key={event.id} variant="default">
                        <FlowCardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-foreground">
                                    {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                                  </span>
                                  {activeTab === "week" && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(event.start.dateTime)}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base font-semibold text-foreground">
                                  {event.subject}
                                </h3>
                              </div>

                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {event.attendees.length} {event.attendees.length === 1 ? "participant" : "participants"}
                                  </span>
                                </div>
                              )}

                              {event.onlineMeetingUrl && (
                                <div className="flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4 text-[#2563EB]" />
                                  <a
                                    href={event.onlineMeetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#2563EB] hover:underline"
                                  >
                                    {t("openInOutlook")}
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="ml-4 flex flex-col items-end gap-2">
                              {isImported ? (
                                <>
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t("imported")}
                                  </Badge>
                                  {meetingId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="text-xs"
                                    >
                                      <a href={`/app/meetings/${meetingId}`}>
                                        {t("viewMeeting")}
                                      </a>
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  onClick={() => handleImport(event.id)}
                                  disabled={isImporting}
                                  size="sm"
                                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                >
                                  {isImporting ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      {t("importing")}
                                    </>
                                  ) : (
                                    t("import")
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </FlowCardContent>
                      </FlowCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
