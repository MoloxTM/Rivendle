"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import GameBoard from "@/components/GameBoard";
import GuessInput from "@/components/GuessInput";
import ShareButton from "@/components/ShareButton";
import StatsModal from "@/components/StatsModal";
import HowToPlay from "@/components/HowToPlay";
import HintBanner from "@/components/HintBanner";
import type { HintDef } from "@/components/HintBanner";
import type { GuessEntry, Character, AttributeComparison, GameStats } from "@/lib/types";
import { loadStats, recordWin } from "@/lib/stats";
import { saveGameState, loadGameState } from "@/lib/gameState";
import Countdown from "@/components/Countdown";

interface CharacterOption {
  id: string;
  name: string;
}

const HINT_THRESHOLDS = [6, 12, 18];

export default function ClassicPage() {
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [dayNumber, setDayNumber] = useState(0);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [serverHints, setServerHints] = useState<
    { type: string; label: string; content: string }[]
  >([]);

  const usedIds = new Set(guesses.map((g) => g.character.id));

  // Restore saved state on mount
  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((data) => {
        setCharacters(data.characters);
        setDayNumber(data.dayNumber);
      });
    setStats(loadStats("classic"));

    const saved = loadGameState("classic");
    if (saved) {
      setGuesses(saved.guesses);
      setWon(saved.won);
      if (saved.hints) setServerHints(saved.hints);
    }
  }, []);

  // Build hint definitions for the UI
  const hintDefs: HintDef[] = [
    {
      type: "quote",
      label: "Citation",
      icon: "\u{1F4AC}",
      content: serverHints.find((h) => h.type === "quote")?.content ?? null,
      unlocksAt: HINT_THRESHOLDS[0],
    },
    {
      type: "description",
      label: "Description",
      icon: "\u{1F464}",
      content: serverHints.find((h) => h.type === "description")?.content ?? null,
      unlocksAt: HINT_THRESHOLDS[1],
    },
    {
      type: "initials",
      label: "Initiales",
      icon: "\u{1F520}",
      content: serverHints.find((h) => h.type === "initials")?.content ?? null,
      unlocksAt: HINT_THRESHOLDS[2],
    },
  ];

  const handleGuess = useCallback(
    async (characterId: string) => {
      if (won || loading) return;
      setLoading(true);

      try {
        const res = await fetch("/api/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "classic",
            guessId: characterId,
            guessCount: guesses.length,
          }),
        });
        const data = await res.json();

        const entry: GuessEntry = {
          character: data.guessedCharacter as Character,
          comparison: data.comparison as AttributeComparison,
        };

        const newGuesses = [entry, ...guesses];
        const newHints =
          data.hints && data.hints.length > 0 ? data.hints : serverHints;

        setGuesses(newGuesses);
        setServerHints(newHints);

        if (data.isCorrect) {
          setWon(true);
          const today = new Date().toISOString().split("T")[0];
          const updated = recordWin("classic", newGuesses.length, today);
          setStats(updated);
          saveGameState("classic", newGuesses, true, newHints);
        } else {
          saveGameState("classic", newGuesses, false, newHints);
        }
      } finally {
        setLoading(false);
      }
    },
    [won, loading, guesses, serverHints]
  );

  return (
    <main className="flex min-h-screen flex-col items-center">
      <Header onStatsClick={() => setShowStats(true)} onHelpClick={() => setShowHelp(true)} />

      <div className="mt-6 flex w-full max-w-4xl flex-col items-center gap-6 px-4 pb-12">
        <div className="text-center">
          <p className="text-sm text-text-dim">
            Rivendle #{dayNumber} - Classic
          </p>
          {won && (
            <div className="mt-2 flex flex-col items-center gap-3">
              <p className="text-lg font-bold text-correct">
                Bravo ! Trouve en {guesses.length} essai
                {guesses.length > 1 ? "s" : ""} !
              </p>
              <ShareButton
                dayNumber={dayNumber}
                mode="Classic"
                guesses={guesses}
                won={won}
              />
              <Countdown />
            </div>
          )}
        </div>

        <GuessInput
          characters={characters}
          usedIds={usedIds}
          onGuess={handleGuess}
          disabled={won}
        />

        {/* Hint circles */}
        <HintBanner hints={hintDefs} guessCount={guesses.length} />

        <GameBoard guesses={guesses} />
      </div>

      {stats && (
        <StatsModal
          stats={stats}
          mode="Classic"
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />
      )}
      <HowToPlay isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </main>
  );
}
