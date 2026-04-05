"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Star, ThumbsDown, ThumbsUp } from "lucide-react";

type SessionRow = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
};

type FeedbackRow = {
  id: string;
  rating: string;
  comment: string | null;
  messageContent: string;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
};

type Payload = {
  sessionRatings: SessionRow[];
  messageFeedbacks: FeedbackRow[];
};

function userLabel(email: string | null, name: string | null): string {
  if (name?.trim()) return name.trim();
  if (email) return email;
  return "—";
}

export function AdminUserReviewsTab() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/user-reviews");
      if (!res.ok) throw new Error("Impossible de charger les avis");
      setData((await res.json()) as Payload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex h-48 items-center justify-center text-indigo-600">
        Chargement des avis…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-indigo-900">
          <Star className="h-6 w-6 text-amber-500" />
          Avis après conversation avec Pilot
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Notes sur 5 étoiles laissées après quelques échanges avec l&apos;assistant (les plus récentes en
          premier).
        </p>
        {data.sessionRatings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Aucune notation enregistrée pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-indigo-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Note</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sessionRatings.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(row.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-800" title={row.userEmail ?? ""}>
                      {userLabel(row.userEmail, row.userName)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-0.5 font-medium text-amber-700">
                        {row.stars}/5
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 text-slate-700">
                      {row.comment ? (
                        <span className="line-clamp-3">{row.comment}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-indigo-900">
          <MessageSquare className="h-6 w-6 text-[#1a56db]" />
          Retours sur les réponses de Pilot
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          Pouce levé ou baissé sur une réponse précise de l&apos;assistant, avec commentaire obligatoire en cas
          de pouce bas.
        </p>
        {data.messageFeedbacks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Aucun retour sur message pour le moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.messageFeedbacks.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("fr-FR")}</time>
                  <span>·</span>
                  <span className="font-medium text-slate-700">{userLabel(row.userEmail, row.userName)}</span>
                  <span
                    className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      row.rating === "positive"
                        ? "bg-blue-50 text-blue-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {row.rating === "positive" ? (
                      <>
                        <ThumbsUp className="h-3 w-3" /> Utile
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-3 w-3" /> Pas utile
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-2 line-clamp-4 text-sm text-slate-700">
                  <span className="font-medium text-slate-500">Réponse évaluée : </span>
                  {row.messageContent}
                </p>
                {row.comment ? (
                  <p className="mt-2 border-t border-slate-100 pt-2 text-sm text-slate-800">
                    <span className="font-medium text-red-700">Commentaire : </span>
                    {row.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
