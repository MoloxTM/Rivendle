"use client";

import type { GuessEntry } from "@/lib/types";
import AttributeCell from "./AttributeCell";

const COLUMNS = [
  { key: "name", label: "Personnage" },
  { key: "race", label: "Race" },
  { key: "genre", label: "Genre" },
  { key: "faction", label: "Faction" },
  { key: "arme", label: "Arme" },
  { key: "statut", label: "Statut" },
  { key: "apparition", label: "Apparition" },
  { key: "age", label: "Age" },
];

interface GameBoardProps {
  guesses: GuessEntry[];
}

export default function GameBoard({ guesses }: GameBoardProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="w-full max-w-4xl overflow-x-auto">
      {/* Column headers */}
      <div className="mb-2 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1 px-1">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="text-center text-xs font-semibold uppercase tracking-wide text-text-dim"
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Guess rows */}
      <div className="flex flex-col gap-1">
        {guesses.map((entry, rowIdx) => (
          <div
            key={`guess-${rowIdx}`}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1"
          >
            {/* Character name - always shown */}
            <div className="flex h-12 items-center justify-center rounded-md bg-surface-light px-2 text-center text-xs font-bold backdrop-blur-sm">
              {entry.character.name}
            </div>

            {/* Attribute cells */}
            <AttributeCell
              value={entry.character.race}
              result={entry.comparison.race}
              delay={1}
            />
            <AttributeCell
              value={entry.character.genre}
              result={entry.comparison.genre}
              delay={2}
            />
            <AttributeCell
              value={entry.character.faction}
              result={entry.comparison.faction}
              delay={3}
            />
            <AttributeCell
              value={entry.character.arme}
              result={entry.comparison.arme}
              delay={4}
            />
            <AttributeCell
              value={entry.character.statut}
              result={entry.comparison.statut}
              delay={5}
            />
            <AttributeCell
              value={entry.character.apparition}
              result={entry.comparison.apparition}
              delay={6}
            />
            <AttributeCell
              value={entry.character.age}
              result={entry.comparison.age}
              delay={7}
              isAge
            />
          </div>
        ))}
      </div>
    </div>
  );
}
