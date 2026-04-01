import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600">
          🎯 30 jours gratuits — sans engagement
        </div>

        <h2 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:text-4xl">
          Votre prochaine réunion mérite
          <br />
          <span className="text-indigo-600">un vrai suivi.</span>
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-lg text-gray-500">
          Rejoignez +200 équipes qui transforment leurs réunions en actions concrètes. Démarrage en 2
          minutes.
        </p>

        <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
          >
            Essayer PILOTYS gratuitement →
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-10 py-4 text-lg font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            Voir les tarifs
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          {[
            "✓ 30 jours gratuits",
            "✓ Sans carte bancaire",
            "✓ Résiliation en 1 clic",
            "✓ Support inclus",
            "✓ Données en Europe",
          ].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
