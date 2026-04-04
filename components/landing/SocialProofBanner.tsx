/**
 * Bandeau sobre : aucun logo client fictif ni témoignage inventé.
 */
export default function SocialProofBanner() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-4 md:py-5">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <p className="text-center text-sm text-gray-600">
          <span className="text-base text-green-600" aria-hidden>
            🔒
          </span>{" "}
          Données hébergées en <strong className="text-gray-900">Europe</strong> ·{" "}
          <strong className="text-gray-900">RGPD</strong>
        </p>
      </div>
    </section>
  );
}
