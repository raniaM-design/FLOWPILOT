import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden border-t border-blue-700/30 bg-gradient-to-br from-[#2563EB] via-[#1d4ed8] to-[#1e3a8a] py-14 md:py-20">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-5 text-center md:px-6">
        <h2 className="mb-4 text-2xl font-extrabold leading-tight text-white md:text-3xl lg:text-4xl">
          Votre prochaine réunion mérite
          <br />
          <span className="text-blue-100">un vrai suivi.</span>
        </h2>

        <p className="mx-auto mb-8 max-w-xl text-[15px] leading-relaxed text-blue-100 md:mb-10 md:text-lg">
          Transformez vos décisions en résultats concrets. Démarrage en 2 minutes.
        </p>

        <Link
          href="/signup"
          className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#2563EB] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-50 md:w-auto md:text-lg"
        >
          Essayer gratuitement →
        </Link>

        <p className="mt-6 text-xs text-blue-200/90 md:text-sm">
          30 jours gratuits · Sans engagement · Résiliation en 1 clic
        </p>
      </div>
    </section>
  );
}
