import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/flowpilot-auth/session";
import NotificationsList from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?error=" + encodeURIComponent("Vous devez être connecté"));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-2">Toutes vos notifications</p>
        </div>
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <NotificationsList />
        </Suspense>
      </div>
    </div>
  );
}

