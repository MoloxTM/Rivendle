"use client";

import { useState, useEffect, useCallback } from "react";
import GuessInput from "./GuessInput";
import HintBanner from "./HintBanner";
import type { HintDef } from "./HintBanner";
import { saveSimpleGameState, loadSimpleGameState } from "@/lib/gameState";
import Countdown from "./Countdown";

interface CharacterOption {
  id: string;
  name: string;
}

const HINT_THRESHOLDS = [6, 12];

export default function QuoteGame() {
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [quote, setQuote] = useState("");
  const [source, setSource] = useState("");
  const [dayNumber, setDayNumber] = useState(0);
  const [guessedNames, setGuessedNames] = useState<string[]>([]);
  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [won, setWon] = useState(false);
  const [answerName, setAnswerName] = useState("");
  const [serverHints, setServerHints] = useState<
    { type: string; label: string; content: string }[]
  >([]);

  const usedIds = new Set(guessedIds);

  useEffect(() => {
    Promise.all([
      fetch("/api/daily").then((r) => r.json()),
      fetch("/api/daily/quote").then((r) => r.json()),
    ]).then(([dailyData, quoteData]) => {
      setCharacters(dailyData.characters);
      setDayNumber(dailyData.dayNumber);
      setQuote(quoteData.text);
      setSource(quoteData.source);
    });

    const saved = loadSimpleGameState("quote");
    if (saved) {
      setGuessedIds(saved.guessedIds);
      setGuessedNames(saved.guessedNames);
      setWon(saved.won);
      setAnswerName(saved.answerName);
      if (saved.hints) setServerHints(saved.hints);
    }
  }, []);

  const hintDefs: HintDef[] = [
    {
      type: "apparition",
      label: "Apparition",
      icon: "\u{1F3AC}",
      content: serverHints.find((h) => h.type === "apparition")?.content ?? null,
      unlocksAt: HINT_THRESHOLDS[0],
    },
    {
      type: "race",
      label: "Race",
      icon: "\u{1F9DD}",
      content: serverHints.find((h) => h.type === "race")?.content ?? null,
      unlocksAt: HINT_THRESHOLDS[1],
    },
  ];

  const handleGuess = useCallback(
    async (characterId: string) => {
      if (won) return;

      const charName =
        characters.find((c) => c.id === characterId)?.name ?? characterId;

      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "quote",
          guessId: characterId,
          guessCount: guessedIds.length,
        }),
      });
      const data = await res.json();

      const newIds = [...guessedIds, characterId];
      const newNames = [...guessedNames, charName];
      const newHints =
        data.hints && data.hints.length > 0 ? data.hints : serverHints;

      setGuessedIds(newIds);
      setGuessedNames(newNames);
      setServerHints(newHints);

      if (data.isCorrect) {
        setWon(true);
        setAnswerName(data.answer.characterName);
        saveSimpleGameState("quote", newIds, newNames, true, data.answer.characterName, newHints);
      } else {
        saveSimpleGameState("quote", newIds, newNames, false, "", newHints);
      }
    },
    [won, characters, guessedIds, guessedNames, serverHints]
  );

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      <p className="text-sm text-text-dim">
        Rivendle #{dayNumber} - Citation
      </p>

      {/* Quote display */}
      <blockquote className="rounded-lg border border-gold-dim/50 bg-surface p-6 text-center text-lg italic text-text backdrop-blur-md">
        &laquo; {quote} &raquo;
      </blockquote>

      {/* Source always visible */}
      {source && (
        <p className="text-xs text-text-dim">
          Source : {source}
        </p>
      )}

      {won && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-correct">
            Bravo ! C&apos;etait {answerName} ! ({guessedNames.length} essai
            {guessedNames.length > 1 ? "s" : ""})
          </p>
          <Countdown />
        </div>
      )}

      <GuessInput
        characters={characters}
        usedIds={usedIds}
        onGuess={handleGuess}
        disabled={won}
      />

      {/* Hint circles */}
      {!won && (
        <HintBanner hints={hintDefs} guessCount={guessedIds.length} />
      )}

      {/* Previous guesses */}
      {guessedNames.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {guessedNames.map((name, i) => (
            <span
              key={i}
              className={`rounded-md px-3 py-1 text-sm ${
                won && i === guessedNames.length - 1
                  ? "bg-correct text-white"
                  : "bg-wrong text-text"
              }`}
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
