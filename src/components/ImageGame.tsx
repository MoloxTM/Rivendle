"use client";

import { useState, useEffect, useCallback } from "react";
import GuessInput from "./GuessInput";
import { saveSimpleGameState, loadSimpleGameState } from "@/lib/gameState";
import Countdown from "./Countdown";

interface CharacterOption {
  id: string;
  name: string;
}

// Blur decreases with each guess, minimum 0
function getBlur(guessCount: number): number {
  const maxBlur = 20;
  const step = 2;
  return Math.max(0, maxBlur - guessCount * step);
}

export default function ImageGame() {
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [imageSrc, setImageSrc] = useState("");
  const [dayNumber, setDayNumber] = useState(0);
  const [guessedNames, setGuessedNames] = useState<string[]>([]);
  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [won, setWon] = useState(false);
  const [answerName, setAnswerName] = useState("");
  const [hasGuessed, setHasGuessed] = useState(false);

  const currentBlur = won ? 0 : getBlur(guessedIds.length);
  const usedIds = new Set(guessedIds);

  useEffect(() => {
    Promise.all([
      fetch("/api/daily").then((r) => r.json()),
      fetch("/api/daily/image").then((r) => r.json()),
    ]).then(([dailyData, imageData]) => {
      setCharacters(dailyData.characters);
      setDayNumber(dailyData.dayNumber);
      setImageSrc(imageData.image);
    });

    const saved = loadSimpleGameState("image");
    if (saved) {
      setGuessedIds(saved.guessedIds);
      setGuessedNames(saved.guessedNames);
      setWon(saved.won);
      setAnswerName(saved.answerName);
      if (saved.guessedIds.length > 0) setHasGuessed(true);
    }
  }, []);

  const handleGuess = useCallback(
    async (characterId: string) => {
      if (won) return;

      const charName =
        characters.find((c) => c.id === characterId)?.name ?? characterId;

      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "image", guessId: characterId }),
      });
      const data = await res.json();

      const newIds = [...guessedIds, characterId];
      const newNames = [...guessedNames, charName];

      setHasGuessed(true);
      setGuessedIds(newIds);
      setGuessedNames(newNames);

      if (data.isCorrect) {
        setWon(true);
        setAnswerName(data.answer.name);
        saveSimpleGameState("image", newIds, newNames, true, data.answer.name);
      } else {
        saveSimpleGameState("image", newIds, newNames, false, "");
      }
    },
    [won, characters, guessedIds, guessedNames]
  );

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      <p className="text-sm text-text-dim">
        Rivendle #{dayNumber} - Image
      </p>

      {/* Blurred image */}
      <div className="relative h-64 w-64 overflow-hidden rounded-xl border-2 border-white/10 bg-surface backdrop-blur-md">
        {imageSrc ? (
          <div
            className={`h-full w-full bg-cover bg-center ${hasGuessed ? "transition-[filter] duration-500" : ""}`}
            style={{
              backgroundImage: `url(${imageSrc})`,
              filter: `blur(${currentBlur}px)`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-dim">
            Chargement...
          </div>
        )}
      </div>

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
