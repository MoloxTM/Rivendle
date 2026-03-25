"use client";

import type { GameStats } from "@/lib/types";

interface StatsModalProps {
  stats: GameStats;
  mode: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({
  stats,
  mode,
  isOpen,
  onClose,
}: StatsModalProps) {
  if (!isOpen) return null;

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const maxDist = Math.max(...stats.guessDistribution, 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl border border-white/10 bg-surface p-6 backdrop-blur-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-xl font-bold text-gold"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            Statistiques - {mode}
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim transition-colors hover:text-text"
          >
            ✕
          </button>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
            <p className="text-xs text-text-dim">Parties</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-text-dim">Victoires</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-text-dim">Serie</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.maxStreak}</p>
            <p className="text-xs text-text-dim">Max</p>
          </div>
        </div>

        {/* Distribution */}
        <h3 className="mb-2 text-sm font-semibold text-text-dim">
          Distribution des essais
        </h3>
        <div className="flex flex-col gap-1">
          {stats.guessDistribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 text-right text-xs text-text-dim">
                {i < 6 ? i + 1 : "X"}
              </span>
              <div
                className="h-5 rounded-sm bg-correct transition-all"
                style={{
                  width: `${Math.max((count / maxDist) * 100, count > 0 ? 8 : 0)}%`,
                  minWidth: count > 0 ? "20px" : "0",
                }}
              />
              <span className="text-xs">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
