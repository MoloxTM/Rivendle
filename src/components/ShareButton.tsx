"use client";

import { useState } from "react";
import type { GuessEntry } from "@/lib/types";

interface ShareButtonProps {
  dayNumber: number;
  mode: string;
  guesses: GuessEntry[];
  won: boolean;
  maxGuesses?: number;
}

function guessToEmojis(entry: GuessEntry): string {
  const attrs = [
    entry.comparison.race,
    entry.comparison.genre,
    entry.comparison.faction,
    entry.comparison.arme,
    entry.comparison.statut,
    entry.comparison.apparition,
    entry.comparison.age,
  ];

  return attrs
    .map((r) => {
      if (r === "correct") return "🟩";
      if (r === "partial") return "🟨";
      return "🟥";
    })
    .join("");
}

export default function ShareButton({
  dayNumber,
  mode,
  guesses,
  won,
  maxGuesses = 6,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const score = won ? `${guesses.length}/${maxGuesses}` : `X/${maxGuesses}`;
    const header = `Rivendle #${dayNumber} - ${mode} ${score}`;

    // Reverse guesses since they're stored newest-first
    const rows = [...guesses]
      .reverse()
      .map((g) => guessToEmojis(g))
      .join("\n");

    const text = `${header}\n${rows}\nrivendle.com`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-lg bg-correct px-6 py-2 font-semibold text-white transition-colors hover:bg-correct/80"
    >
      {copied ? "Copie !" : "Partager"}
    </button>
  );
}
