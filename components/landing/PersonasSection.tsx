import Link from "next/link";

const personas = [
  {
    icon: "👔",
    role: "Manager & Chef de projet",
    pain: "Vous passez plus de temps à relancer votre équipe qu'à piloter vraiment.",
    gains: [
      "Chaque action est assignée avec un responsable et une date",
      "Vous voyez en 1 coup d'œil ce qui bloque",
      "Plus besoin de relancer — le suivi est automatique",
      "Weekly Review en 10 minutes au lieu de 1h",
    ],
    cta: "Voir la démo Manager",
    color: "indigo",
    badge: "Le plus utilisé",
  },
  {
    icon: "💼",
    role: "Consultant & Freelance",
    pain: "Vous gérez plusieurs clients en parallèle. Une décision perdue = une relation abîmée.",
    gains: [
      "Historique complet de chaque décision client",
      "Compte-rendu professionnel généré automatiquement",
      "Exports PDF / PPT pour vos livrables clients",
      "Pilotage multi-projets sans se noyer",
    ],
    cta: "Voir la démo Consultant",
    color: "blue",
    badge: null as string | null,
  },
  {
    icon: "🏢",
    role: "PME & Équipe dirigeante",
    pain: "Vos réunions de CODIR produisent des décisions que personne ne suit 2 semaines plus tard.",
    gains: [
      "Traçabilité complète pour l'audit et la gouvernance",
      "Alignement de toute l'équipe sur les priorités",
      "Roadmap et Gantt partagés en temps réel",
      "Données sécurisées et hébergées en Europe",
    ],
    cta: "Voir la démo PME",
    color: "violet",
    badge: null as string | null,
  },
];

const colorMap: Record<string, string> = {
  indigo: "border-indigo-200 bg-indigo-50 hover:border-indigo-400",
  blue: "border-blue-200 bg-blue-50 hover:border-blue-400",
  violet: "border-violet-200 bg-violet-50 hover:border-violet-400",
};

const iconColorMap: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
};

const checkColorMap: Record<string, string> = {
  indigo: "text-indigo-500",
  blue: "text-blue-500",
  violet: "text-violet-500",
};

export default function PersonasSection() {
  return (
    <section className="bg-white py-12 md:py-20" id="use-cases">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Pour qui ?
          </p>
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl">
            PILOTYS s&apos;adapte à votre contexte
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">
            Que vous soyez seul ou en équipe, manager ou consultant, PILOTYS résout votre problème
            précis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {personas.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border-2 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${colorMap[p.color]}`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                  {p.badge}
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${iconColorMap[p.color]}`}
                >
                  {p.icon}
                </div>
                <h3 className="text-base font-extrabold leading-tight text-gray-900">{p.role}</h3>
              </div>

              <p className="mb-5 border-l-2 border-gray-200 pl-3 text-sm italic leading-relaxed text-gray-500">
                &ldquo;{p.pain}&rdquo;
              </p>

              <ul className="mb-6 space-y-2">
                {p.gains.map((g, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-0.5 flex-shrink-0 font-bold ${checkColorMap[p.color]}`}>
                      ✓
                    </span>
                    {g}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
              >
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
