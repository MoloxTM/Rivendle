import characters from "@/data/characters.json";
import quotes from "@/data/quotes.json";
import type { DailyData } from "./types";

// Simple seeded random number generator
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Reference date for day numbering
const EPOCH = new Date("2026-03-05").getTime();

export function getDailyData(dateStr: string): DailyData {
  const seed = dateSeed(dateStr);
  const rng = seededRandom(seed);

  const dayNumber =
    Math.floor(
      (new Date(dateStr).getTime() - EPOCH) / (1000 * 60 * 60 * 24)
    ) + 1;

  const classicIndex = Math.floor(rng() * characters.length);
  const quoteIndex = Math.floor(rng() * quotes.length);
  // For image mode, reuse character pool with different seed position
  const imageIndex = Math.floor(rng() * characters.length);

  return {
    classicCharacterId: characters[classicIndex].id,
    quoteId: quotes[quoteIndex].id,
    imageId: characters[imageIndex].id,
    dayNumber,
  };
}

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
