import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 py-12 md:py-20">
      <div className="mx-auto max-w-4xl px-5 text-center md:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600">
          🎯 30 jours gratuits — sans engagement
        </div>

        <h2 className="mb-4 text-2xl font-extrabold leading-tight text-gray-900 md:text-3xl lg:text-4xl">
          Votre prochaine réunion mérite
          <br />
          <span className="text-indigo-600">un vrai suivi.</span>
        </h2>

        <p className="mx-auto mb-8 max-w-xl text-[15px] leading-snug text-gray-500 md:mb-10 md:text-lg">
          Transformez votre prochaine réunion en actions concrètes.
        </p>

        <div className="mb-8 flex w-full flex-col justify-center gap-3 md:flex-row md:flex-wrap">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 md:w-auto md:text-lg"
          >
            Essayer PILOTYS gratuitement →
          </Link>
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-10 py-4 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50 md:w-auto md:text-lg"
          >
            Voir les tarifs
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 md:gap-6 md:text-sm">
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
