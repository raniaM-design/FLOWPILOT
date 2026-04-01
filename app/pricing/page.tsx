import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

const plans = [
  {
    name: "Solo",
    price: "12",
    period: "/mois",
    annual: "120€/an (2 mois offerts)",
    desc: "Pour les freelances et consultants indépendants.",
    features: [
      "1 utilisateur",
      "Projets illimités",
      "Réunions & comptes-rendus illimités",
      "Kanban, Roadmap, Gantt",
      "Exports PDF / PPT",
      "Weekly & Monthly Review",
      "Support par email",
    ],
    cta: "Commencer Solo",
    href: "/signup",
    highlight: false,
    badge: null as string | null,
  },
  {
    name: "Équipe",
    price: "49",
    period: "/mois",
    annual: "490€/an (2 mois offerts)",
    desc: "Pour les équipes jusqu'à 10 personnes. Prix fixe, pas de surprise.",
    features: [
      "Jusqu'à 10 utilisateurs inclus",
      "Tout Solo inclus",
      "Gestion des rôles et permissions",
      "Tableau de bord équipe centralisé",
      "Points bloquants partagés",
      "Support prioritaire",
      "Onboarding dédié",
    ],
    cta: "Commencer Équipe",
    href: "/signup",
    highlight: true,
    badge: "⭐ Le plus populaire",
  },
  {
    name: "Organisation",
    price: "Sur devis",
    period: "",
    annual: "",
    desc: "Pour les grandes équipes et organisations avec des besoins spécifiques.",
    features: [
      "Utilisateurs illimités",
      "Tout Équipe inclus",
      "SSO / SAML",
      "Intégrations sur mesure",
      "SLA garanti",
      "Gestionnaire de compte dédié",
      "Formation équipe incluse",
    ],
    cta: "Nous contacter",
    href: "mailto:contact@pilotys.com",
    highlight: false,
    badge: null as string | null,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <main>
        <div className="border-b border-gray-100 bg-gray-50 py-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Tarifs
          </p>
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
            Simple, transparent, sans surprise
          </h1>
          <p className="mx-auto mb-6 max-w-xl text-lg text-gray-500">
            30 jours d&apos;essai gratuit sur tous les plans. Sans carte bancaire.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm">
            <span className="font-semibold text-gray-900">Mensuel</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">
              Annuel <span className="font-semibold text-green-600">-17%</span>
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
                  plan.highlight
                    ? "scale-[1.02] border-indigo-500 bg-indigo-600 shadow-2xl shadow-indigo-200"
                    : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-lg"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`mb-1 text-lg font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mb-4 text-xs leading-relaxed ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}
                  >
                    {plan.desc}
                  </p>
                  <div className="flex items-end gap-1">
                    <span
                      className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={`mb-1 text-sm ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                  {plan.annual && (
                    <p
                      className={`mt-1 text-xs ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}
                    >
                      ou {plan.annual}
                    </p>
                  )}
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-indigo-100" : "text-gray-600"}`}
                    >
                      <span
                        className={`mt-0.5 flex-shrink-0 font-bold ${plan.highlight ? "text-green-300" : "text-indigo-500"}`}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.href.startsWith("mailto:") ? (
                  <a
                    href={plan.href}
                    className={`w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-white text-indigo-600 shadow-lg hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href={plan.href}
                    className={`w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      plan.highlight
                        ? "bg-white text-indigo-600 shadow-lg hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              {[
                "✓ 30 jours gratuits sur tous les plans",
                "✓ Sans carte bancaire",
                "✓ Résiliation en 1 clic",
                "✓ Migration d'un plan à l'autre à tout moment",
                "✓ Données exportables",
              ].map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-2xl">
            <h3 className="mb-6 text-center text-xl font-extrabold text-gray-900">
              Questions fréquentes
            </h3>
            <div className="space-y-4">
              {[
                {
                  q: "Que se passe-t-il après 30 jours ?",
                  a: "Vous choisissez un plan payant ou arrêtez. Aucune facturation automatique sans votre accord.",
                },
                {
                  q: "Le plan Équipe, c'est vraiment 49€ fixe pour 10 personnes ?",
                  a: "Oui. 49€/mois pour toute l'équipe jusqu'à 10 utilisateurs, sans facturation par tête.",
                },
                {
                  q: "Puis-je changer de plan à tout moment ?",
                  a: "Oui, depuis votre compte. La modification prend effet immédiatement avec proratisation.",
                },
                {
                  q: "Mes données sont-elles sécurisées ?",
                  a: "Hébergement en Europe, chiffrement SSL, conformité RGPD. Vos données vous appartiennent.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-100 bg-gray-50 px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-800">
                    {faq.q}
                    <span className="text-gray-400 transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
