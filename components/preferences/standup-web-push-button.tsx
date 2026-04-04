"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function StandupWebPushButton() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [vapidPublic, setVapidPublic] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshMeta = useCallback(async () => {
    const res = await fetch("/api/user/web-push");
    if (!res.ok) return;
    const data = await res.json();
    setConfigured(!!data.configured);
    setVapidPublic(typeof data.publicKey === "string" ? data.publicKey : null);
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  const enablePush = async () => {
    if (!vapidPublic || !configured) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      });

      const res = await fetch("/api/user/web-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (res.ok) setSubscribed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const disablePush = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/user/web-push", { method: "DELETE" });
      setSubscribed(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (configured === false || !vapidPublic) {
    return (
      <p className="text-sm text-muted-foreground">
        Les notifications push navigateur sont désactivées sur cette instance (clés VAPID non
        configurées). Tu reçois tout de même un e-mail et une notification dans l’app après
        l’heure de rappel.
      </p>
    );
  }

  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return (
      <p className="text-sm text-muted-foreground">
        Ce navigateur ne prend pas en charge les notifications push.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {subscribed ? (
        <Button type="button" variant="outline" onClick={disablePush} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4 mr-2" />}
          Désactiver les notifications navigateur
        </Button>
      ) : (
        <Button type="button" onClick={enablePush} disabled={busy || configured !== true}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
          Activer les notifications push (navigateur)
        </Button>
      )}
      <p className="text-xs text-muted-foreground max-w-xl">
        En complément de l’e-mail et de la cloche FlowPilot, tu peux autoriser une alerte sur ton
        appareil lorsque le standup n’est pas fait après l’heure de rappel.
      </p>
    </div>
  );
}
