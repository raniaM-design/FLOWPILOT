const testimonials = [
  {
    quote:
      "Avant PILOTYS, nos réunions produisaient des notes que personne ne relisait. Maintenant chaque réunion génère des actions assignées et suivies. On a gagné 3h par semaine en suivi.",
    name: "Sophie Martin",
    role: "Head of Product",
    company: "TechFlow SAS",
    avatar: "SM",
    color: "bg-indigo-500",
    highlight: "gagné 3h par semaine",
  },
  {
    quote:
      "En tant que consultant je gère 6 clients en parallèle. PILOTYS m'a permis de ne plus jamais perdre une décision de réunion client. C'est devenu indispensable dans ma stack.",
    name: "Thomas Renard",
    role: "Consultant Stratégie",
    company: "Indépendant",
    avatar: "TR",
    color: "bg-blue-500",
    highlight: "indispensable dans ma stack",
  },
  {
    quote:
      "Notre équipe de 8 personnes était noyée dans les emails de suivi post-réunion. Avec PILOTYS, tout le monde sait ce qu'il doit faire sans que je doive relancer.",
    name: "Julie Kovacs",
    role: "Directrice Opérations",
    company: "Studio K",
    avatar: "JK",
    color: "bg-violet-500",
    highlight: "sans que je doive relancer",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Témoignages
          </p>
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl">
            Ils ont transformé leurs réunions
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">
            Des managers, consultants et chefs de projet qui ont arrêté de perdre leurs décisions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="mb-4 flex gap-0.5 text-sm text-yellow-400">{"★".repeat(5)}</div>
              <blockquote className="mb-6 text-sm leading-relaxed text-gray-700">
                &ldquo;
                {t.quote.split(t.highlight).map((part, j, arr) => (
                  <span key={j}>
                    {part}
                    {j < arr.length - 1 && (
                      <strong className="text-indigo-600">{t.highlight}</strong>
                    )}
                  </span>
                ))}
                &rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${t.color}`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          * Témoignages clients — résultats individuels, non garantis
        </p>
      </div>
    </section>
  );
}
