const badges = [
  {
    icon: "🔒",
    title: "Europe",
    desc: "Hébergement Europe uniquement",
  },
  {
    icon: "✅",
    title: "RGPD",
    desc: "Vos données vous appartiennent",
  },
  {
    icon: "🔐",
    title: "SSL/TLS 1.3",
    desc: "Communications chiffrées",
  },
  {
    icon: "💳",
    title: "Stripe",
    desc: "Paiement sécurisé, 0 carte stockée",
  },
];

export default function TrustBadges() {
  return (
    <section className="border-t border-gray-100 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-5 md:px-6">
        <div className="mb-8 text-center md:mb-10">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Sécurité &amp; conformité
            </p>
            <span className="hidden h-px flex-1 max-w-xs bg-slate-200 md:block" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">Vos données sont en sécurité</h2>
          <p className="mt-2 text-base text-slate-600">Infrastructure sérieuse pour des équipes sérieuses.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-indigo-100/80 bg-slate-50/80 p-4 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-sm"
            >
              <span className="mb-2 text-2xl" aria-hidden>
                {b.icon}
              </span>
              <p className="text-sm font-semibold text-gray-900">{b.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
