export default function EarlyAdoptersSection() {
  return (
    <section className="border-y border-indigo-100 bg-indigo-50 py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Early Adopters
        </p>
        <h2 className="mb-4 text-2xl font-extrabold text-gray-900">
          Vous utilisez PILOTYS ?
          <br />
          Partagez votre expérience.
        </h2>
        <p className="mb-8 text-gray-500">
          Nous sommes en lancement. Vos retours nous aident à améliorer le produit et permettent aux
          prochains utilisateurs de faire confiance.
        </p>
        <a
          href="mailto:contact@pilotys.com?subject=Mon%20avis%20sur%20PILOTYS"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700"
        >
          ✉️ Partager mon avis
        </a>
      </div>
    </section>
  );
}
