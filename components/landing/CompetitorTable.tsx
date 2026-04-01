import Link from "next/link";

type Feature = {
  label: string;
  pilotys: boolean | string;
  notion: boolean | string;
  monday: boolean | string;
  asana: boolean | string;
};

const features: Feature[] = [
  {
    label: "Extraction auto des décisions depuis CR",
    pilotys: true,
    notion: false,
    monday: false,
    asana: false,
  },
  {
    label: "Actions reliées aux décisions",
    pilotys: true,
    notion: "⚠️ Manuel",
    monday: "⚠️ Partiel",
    asana: "⚠️ Partiel",
  },
  {
    label: "Kanban + Roadmap + Gantt intégrés",
    pilotys: true,
    notion: "⚠️ Séparé",
    monday: true,
    asana: "⚠️ Partiel",
  },
  {
    label: "Weekly & Monthly Review automatique",
    pilotys: true,
    notion: false,
    monday: false,
    asana: false,
  },
  {
    label: "Exports PDF / PPT professionnels",
    pilotys: true,
    notion: "⚠️ PDF seul",
    monday: false,
    asana: false,
  },
  {
    label: "Données hébergées en Europe (RGPD)",
    pilotys: true,
    notion: false,
    monday: "⚠️ Option",
    asana: false,
  },
  {
    label: "Prix par utilisateur / mois",
    pilotys: "12€",
    notion: "10€",
    monday: "12€",
    asana: "11€",
  },
  {
    label: "Spécialisé réunions → actions",
    pilotys: true,
    notion: false,
    monday: false,
    asana: false,
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-lg text-green-500">✓</span>;
  if (value === false) return <span className="text-lg text-red-400">✗</span>;
  return <span className="text-xs font-medium text-yellow-500">{value}</span>;
}

export default function CompetitorTable() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Comparatif
          </p>
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 lg:text-4xl">
            Pourquoi PILOTYS et pas les autres ?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">
            Notion, Monday, Asana sont des outils généralistes. PILOTYS est le seul conçu
            spécifiquement pour transformer vos réunions en résultats.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-2/5 px-6 py-4 text-left font-semibold text-gray-500">
                    Fonctionnalité
                  </th>
                  <th className="px-4 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="mb-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                        PILOTYS
                      </span>
                      <span className="text-xs font-semibold text-indigo-600">⭐ Recommandé</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-400">Notion</th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-400">Monday</th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-400">Asana</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-700">{f.label}</td>
                    <td className="bg-indigo-50/30 px-4 py-3.5 text-center">
                      <Cell value={f.pilotys} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Cell value={f.notion} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Cell value={f.monday} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Cell value={f.asana} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          ⚠️ = disponible partiellement ou avec configuration manuelle · Données indicatives,
          vérifiées en avril 2026
        </p>

        <div className="mt-10 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
          >
            Essayer PILOTYS gratuitement →
          </Link>
          <p className="mt-2 text-sm text-gray-400">30 jours gratuits · Sans carte bancaire</p>
        </div>
      </div>
    </section>
  );
}
