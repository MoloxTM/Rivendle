import type { GuessEntry } from "./types";

const STATE_KEY_PREFIX = "rivendle-state-";

interface SavedGameState {
  date: string;
  guesses: GuessEntry[];
  won: boolean;
  hints: { type: string; label: string; content: string }[];
}

function getKey(mode: string): string {
  return `${STATE_KEY_PREFIX}${mode}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function saveGameState(
  mode: string,
  guesses: GuessEntry[],
  won: boolean,
  hints: { type: string; label: string; content: string }[] = []
): void {
  if (typeof window === "undefined") return;
  const state: SavedGameState = {
    date: getTodayStr(),
    guesses,
    won,
    hints,
  };
  localStorage.setItem(getKey(mode), JSON.stringify(state));
}

export function loadGameState(mode: string): SavedGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getKey(mode));
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedGameState;
    // Only return if it's today's state
    if (state.date !== getTodayStr()) return null;
    return state;
  } catch {
    return null;
  }
}

// Simplified state for quote/image modes (no GuessEntry, just names + ids)
interface SavedSimpleGameState {
  date: string;
  guessedIds: string[];
  guessedNames: string[];
  won: boolean;
  answerName: string;
  hints: { type: string; label: string; content: string }[];
}

export function saveSimpleGameState(
  mode: string,
  guessedIds: string[],
  guessedNames: string[],
  won: boolean,
  answerName: string,
  hints: { type: string; label: string; content: string }[] = []
): void {
  if (typeof window === "undefined") return;
  const state: SavedSimpleGameState = {
    date: getTodayStr(),
    guessedIds,
    guessedNames,
    won,
    answerName,
    hints,
  };
  localStorage.setItem(getKey(mode), JSON.stringify(state));
}

export function loadSimpleGameState(mode: string): SavedSimpleGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getKey(mode));
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedSimpleGameState;
    if (state.date !== getTodayStr()) return null;
    return state;
  } catch {
    return null;
  }
}

// Map mode state
interface SavedMapGameState {
  date: string;
  guesses: { lat: number; lng: number; distance: number }[];
  won: boolean;
  locationName: string;
  correctLat: number;
  correctLng: number;
}

export function saveMapGameState(
  guesses: { lat: number; lng: number; distance: number }[],
  won: boolean,
  locationName: string,
  correctLat: number,
  correctLng: number
): void {
  if (typeof window === "undefined") return;
  const state: SavedMapGameState = {
    date: getTodayStr(),
    guesses,
    won,
    locationName,
    correctLat,
    correctLng,
  };
  localStorage.setItem(getKey("map"), JSON.stringify(state));
}

export function loadMapGameState(): SavedMapGameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getKey("map"));
    if (!raw) return null;
    const state = JSON.parse(raw) as SavedMapGameState;
    if (state.date !== getTodayStr()) return null;
    return state;
  } catch {
    return null;
  }
}
