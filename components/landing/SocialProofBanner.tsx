export default function SocialProofBanner() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Nouveau</strong> — Soyez parmi les premiers à tester
          </p>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>🚀</span>
            <span>
              <strong className="text-gray-900">Lancement en cours</strong> — Accès early adopter
            </span>
          </div>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base text-green-500">🔒</span>
            <span>
              Données hébergées en <strong className="text-gray-900">Europe</strong> ·{" "}
              <strong className="text-gray-900">RGPD</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
