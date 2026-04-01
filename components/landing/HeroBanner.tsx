import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-white" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 pb-20 pt-24 lg:flex-row">
        {/* TEXTE GAUCHE */}
        <div className="flex-1 text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            <span>⚡</span>
            Le seul outil qui relie vos réunions à vos résultats
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-gray-900 lg:text-5xl xl:text-6xl">
            Fini les réunions
            <br />
            <span className="text-indigo-600">sans lendemain.</span>
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-500 lg:text-xl">
            PILOTYS extrait automatiquement les décisions et actions de vos comptes-rendus.{" "}
            <strong className="text-gray-700">
              Qui fait quoi, pour quand, ce qui bloque
            </strong>{" "}
            — visible en un coup d&apos;œil par toute l&apos;équipe.
          </p>

          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Essayer gratuitement →
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              ▶ Voir la démo (60s)
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 lg:justify-start">
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> 30 jours gratuits
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> Sans carte bancaire
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> Démarrage en 2 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-500">✓</span> Données hébergées en Europe
            </span>
          </div>
        </div>

        {/* VISUEL DROITE — Dashboard mock */}
        <div className="w-full max-w-xl flex-1">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/80">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="ml-2 text-xs text-gray-400">pilotys.io/dashboard</span>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Réunion produit — 15 jan.</h3>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Analysée ✓
                </span>
              </div>

              <div className="mb-4 space-y-2">
                {[
                  {
                    action: "Finaliser les maquettes v2",
                    who: "Sophie M.",
                    date: "20 jan.",
                    status: "En cours",
                    color: "blue",
                  },
                  {
                    action: "Valider le budget marketing",
                    who: "Thomas R.",
                    date: "18 jan.",
                    status: "En retard",
                    color: "red",
                  },
                  {
                    action: "Envoyer recap client Acme",
                    who: "Julie K.",
                    date: "16 jan.",
                    status: "Terminé",
                    color: "green",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5"
                  >
                    <div
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        item.color === "blue"
                          ? "bg-blue-400"
                          : item.color === "red"
                            ? "bg-red-400"
                            : "bg-green-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-800">{item.action}</p>
                      <p className="text-xs text-gray-400">
                        {item.who} · {item.date}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.color === "blue"
                          ? "bg-blue-50 text-blue-600"
                          : item.color === "red"
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Décisions", value: "4" },
                  { label: "Actions", value: "12" },
                  { label: "Bloquants", value: "1" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-center"
                  >
                    <div className="text-lg font-bold text-gray-800">{s.value}</div>
                    <div className="text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
