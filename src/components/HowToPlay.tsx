"use client";

interface HowToPlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlay({ isOpen, onClose }: HowToPlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-surface p-6 backdrop-blur-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-xl font-bold text-gold"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            Comment jouer
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim transition-colors hover:text-text"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm text-text">
          <p>
            Devinez le personnage de Tolkien du jour ! Un nouveau personnage
            chaque jour dans 3 modes differents.
          </p>

          <div>
            <h3 className="mb-1 font-semibold text-gold">Mode Classic</h3>
            <p>
              Tapez un nom de personnage. Apres chaque essai, les attributs
              s&apos;affichent en couleur :
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              <li className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-sm bg-correct" />
                <span>Vert = attribut correct</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-sm bg-wrong" />
                <span>Gris = attribut incorrect</span>
              </li>
              <li className="flex items-center gap-2">
                <span>↑ / ↓</span>
                <span>= le personnage est plus vieux / plus jeune</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-gold">Mode Citation</h3>
            <p>
              Une citation mystere s&apos;affiche. Devinez quel personnage l&apos;a
              prononcee en 6 essais maximum. Un indice apparait apres 2 erreurs.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-gold">Mode Image</h3>
            <p>
              Une image floue apparait. A chaque mauvaise reponse, l&apos;image
              devient plus nette. 6 essais maximum.
            </p>
          </div>

          <p className="text-text-dim">
            Les attributs compares sont : Race, Genre, Faction, Arme, Statut,
            Apparition et Age.
          </p>
        </div>
      </div>
    </div>
  );
}
