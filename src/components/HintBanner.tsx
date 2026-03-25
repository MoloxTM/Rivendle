"use client";

import { useState } from "react";

export interface HintDef {
  type: string;
  label: string;
  icon: string;
  content: string | null; // null = locked
  unlocksAt: number;
}

interface HintBannerProps {
  hints: HintDef[];
  guessCount: number;
}

export default function HintBanner({ hints, guessCount }: HintBannerProps) {
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(new Set());

  if (hints.length === 0) return null;

  function toggleReveal(idx: number) {
    setRevealedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-3">
      {/* Hint circles row */}
      <div className="flex items-center gap-6">
        {hints.map((hint, i) => {
          const isUnlocked = hint.content !== null;
          const isRevealed = revealedIdx.has(i);
          const remaining = hint.unlocksAt - guessCount;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <button
                onClick={() => isUnlocked && toggleReveal(i)}
                disabled={!isUnlocked}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                  isUnlocked
                    ? isRevealed
                      ? "border-gold bg-gold/20 text-gold shadow-[0_0_12px_rgba(201,168,76,0.3)]"
                      : "border-gold bg-surface text-gold hover:bg-gold/10 cursor-pointer"
                    : "border-surface-light bg-surface text-text-dim cursor-not-allowed opacity-50"
                }`}
                aria-label={hint.label}
              >
                <span className="text-2xl">{hint.icon}</span>
              </button>
              <span className="text-center text-[10px] leading-tight text-text-dim">
                {isUnlocked ? (
                  <>Indice {hint.label}</>
                ) : (
                  <>
                    Indice {hint.label}
                    <br />
                    dans {remaining} essai{remaining > 1 ? "s" : ""}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Revealed hint content */}
      {hints.map((hint, i) => {
        if (!revealedIdx.has(i) || !hint.content) return null;
        return (
          <div
            key={`content-${i}`}
            className="animate-flip w-full rounded-lg border border-gold-dim/50 bg-surface px-4 py-3 backdrop-blur-md"
            style={{ animationDelay: "0s" }}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold">
              {hint.label}
            </p>
            {hint.type === "quote" ? (
              <p className="italic text-text">
                &laquo; {hint.content} &raquo;
              </p>
            ) : (
              <p className="text-sm text-text">{hint.content}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
