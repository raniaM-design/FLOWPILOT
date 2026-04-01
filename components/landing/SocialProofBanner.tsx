export default function SocialProofBanner() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["bg-indigo-400", "bg-blue-400", "bg-violet-400", "bg-pink-400"].map((color, i) => (
                <div
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${color}`}
                >
                  {["S", "T", "M", "J"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">+200 équipes</strong> pilotent avec PILOTYS
            </p>
          </div>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex text-base text-yellow-400">{"★".repeat(5)}</div>
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">4.8/5</strong> — 47 avis vérifiés
            </p>
          </div>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base text-green-500">🔒</span>
            <span>
              Données hébergées en <strong className="text-gray-900">Europe · RGPD</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
