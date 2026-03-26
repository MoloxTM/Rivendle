"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modes = [
  { name: "Classic", href: "/" },
  { name: "Citation", href: "/quote" },
  { name: "Image", href: "/image" },
  { name: "Carte", href: "/map" },
];

interface HeaderProps {
  onStatsClick?: () => void;
  onHelpClick?: () => void;
}

export default function Header({ onStatsClick, onHelpClick }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Help button */}
          <button
            onClick={onHelpClick}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-surface-light hover:text-text"
            aria-label="Aide"
          >
            ?
          </button>

          <h1
            className="text-center text-4xl font-bold tracking-wider"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            <span className="text-gold">R</span>IVEN
            <span className="text-gold">DLE</span>
          </h1>

          {/* Stats button */}
          <button
            onClick={onStatsClick}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-surface-light hover:text-text"
            aria-label="Statistiques"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </button>
        </div>

        <nav className="mt-3 flex justify-center gap-1">
          {modes.map((mode) => {
            const isActive =
              pathname === mode.href ||
              (mode.href !== "/" && pathname.startsWith(mode.href));
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gold text-background"
                    : "text-text-dim hover:bg-surface-light hover:text-text"
                }`}
              >
                {mode.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
