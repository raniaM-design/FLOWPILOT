import Link from "next/link";

export default function RoiSection() {
  return (
    <section className="bg-indigo-600 py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-200">
            Le coût de l&apos;inaction
          </p>
          <h2 className="mb-4 text-3xl font-extrabold text-white lg:text-4xl">
            Une réunion d&apos;1h pour 5 personnes
            <br />
            <span className="text-indigo-200">coûte 500€ à votre entreprise.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-indigo-200">
            Si elle ne produit aucune action suivie, c&apos;est 500€ perdus. PILOTYS se rembourse dès
            le premier mois.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:mb-14 md:grid-cols-3">
          {[
            {
              icon: "⏱️",
              value: "3h",
              label: "économisées par semaine",
              desc: "en suivi post-réunion éliminé",
            },
            {
              icon: "💸",
              value: "500€",
              label: "de coût évité par mois",
              desc: "pour une équipe de 5 personnes",
            },
            {
              icon: "📉",
              value: "-60%",
              label: "de réunions répétitives",
              desc: "grâce au suivi automatique",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur"
            >
              <div className="mb-3 text-3xl">{s.icon}</div>
              <div className="mb-1 text-4xl font-extrabold text-white">{s.value}</div>
              <div className="mb-1 text-sm font-semibold text-indigo-100">{s.label}</div>
              <div className="text-xs text-indigo-300">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-4 md:mb-12 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-3 text-sm font-semibold text-red-300">❌ Sans PILOTYS</p>
            {[
              "Les décisions se perdent dans les emails",
              "Personne ne sait qui doit faire quoi",
              "On refait la même réunion 2 semaines plus tard",
              "Le manager relance manuellement chaque semaine",
            ].map((item, i) => (
              <div key={i} className="mb-2 flex items-start gap-2 text-sm text-indigo-200">
                <span className="mt-0.5 flex-shrink-0 text-red-400">×</span>
                {item}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="mb-3 text-sm font-semibold text-green-300">✅ Avec PILOTYS</p>
            {[
              "Chaque décision est documentée avec son contexte",
              "Chaque action est assignée avec une échéance",
              "Le suivi est automatique, visible par tous",
              "Le manager pilote, il ne court plus après",
            ].map((item, i) => (
              <div key={i} className="mb-2 flex items-start gap-2 text-sm text-indigo-100">
                <span className="mt-0.5 flex-shrink-0 text-green-400">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Commencer gratuitement — 30 jours offerts →
          </Link>
          <p className="mt-3 text-sm text-indigo-300">Sans carte bancaire · Résiliation en 1 clic</p>
        </div>
      </div>
    </section>
  );
}
