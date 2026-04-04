const badges = [
  {
    icon: "🔒",
    title: "Données en Europe",
    desc: "Vos données applicatives sont hébergées en Europe",
  },
  {
    icon: "✅",
    title: "Conforme RGPD",
    desc: "Vos données vous appartiennent. Suppression à tout moment.",
  },
  {
    icon: "🔐",
    title: "Chiffrement SSL",
    desc: "Toutes les communications chiffrées en HTTPS / TLS 1.3",
  },
  {
    icon: "📋",
    title: "CGV & Mentions légales",
    desc: "Documents légaux complets, transparents et accessibles",
  },
  {
    icon: "🚫",
    title: "Zéro revente de données",
    desc: "Vos données ne sont jamais vendues ni partagées",
  },
  {
    icon: "💳",
    title: "Paiement sécurisé",
    desc: "Stripe — standard bancaire, aucune donnée carte stockée",
  },
];

export default function TrustBadges() {
  return (
    <section className="border-t border-gray-100 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-5 md:px-6">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Sécurité & Conformité
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900">Vos données sont en sécurité</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {badges.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <span className="flex-shrink-0 text-2xl">{b.icon}</span>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-gray-800">{b.title}</p>
                <p className="text-xs leading-relaxed text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
