const CLIENT_LOGOS = [
  { name: "TechFlow" },
  { name: "Studio Nord" },
  { name: "Acme SaaS" },
  { name: "BluePeak" },
  { name: "Helix PM" },
  { name: "Vertigo Labs" },
];

const TESTIMONIALS = [
  {
    quote: "Enfin un fil direct entre nos réunions et les actions sur le terrain.",
    author: "Chef de projet",
    org: "PME services",
  },
  {
    quote: "Moins de relances, plus de clarté sur qui fait quoi.",
    author: "Manager",
    org: "Équipe produit",
  },
  {
    quote: "Le compte rendu ne reste plus dans un coin du drive.",
    author: "Consultante",
    org: "Cabinet conseil",
  },
];

export default function SocialProofBanner() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-center text-sm text-gray-600 md:text-left">
            <strong className="text-gray-900">Nouveau</strong> — Soyez parmi les premiers à tester
          </p>

          <div className="hidden h-8 w-px bg-gray-200 md:block" />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>🚀</span>
            <span>
              <strong className="text-gray-900">Lancement en cours</strong> — Accès early adopter
            </span>
          </div>

          <div className="hidden h-8 w-px bg-gray-200 md:block" />

          <div className="flex items-center gap-2 text-center text-sm text-gray-600 md:text-left">
            <span className="text-base text-green-500">🔒</span>
            <span>
              Données hébergées en <strong className="text-gray-900">Europe</strong> ·{" "}
              <strong className="text-gray-900">RGPD</strong>
            </span>
          </div>
        </div>

        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-10 md:grid md:grid-cols-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          {CLIENT_LOGOS.map((c, i) => (
            <div
              key={i}
              className="flex h-14 min-w-[100px] shrink-0 snap-center items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold tracking-tight text-gray-500 shadow-sm md:min-w-0"
            >
              <span className="truncate">{c.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 md:mt-10">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 md:mb-4">
            Ils testent PILOTYS
          </p>
          <div className="max-md:block md:grid md:grid-cols-3 md:gap-4">
            {TESTIMONIALS.map((item, i) => (
              <blockquote
                key={i}
                className={`rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm md:p-5 md:text-left ${i > 0 ? "max-md:hidden" : ""}`}
              >
                <p className="text-sm font-medium leading-snug text-gray-800">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-3 text-xs text-gray-500">
                  — {item.author}, {item.org}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
