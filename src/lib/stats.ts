import type { GameStats } from "./types";

const STORAGE_KEY_PREFIX = "rivendle-stats-";

function getKey(mode: string): string {
  return `${STORAGE_KEY_PREFIX}${mode}`;
}

function defaultStats(): GameStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0, 0], // 1-6, 7+ (fail)
    lastPlayedDate: "",
  };
}

export function loadStats(mode: string): GameStats {
  if (typeof window === "undefined") return defaultStats();
  try {
    const raw = localStorage.getItem(getKey(mode));
    if (!raw) return defaultStats();
    return JSON.parse(raw) as GameStats;
  } catch {
    return defaultStats();
  }
}

export function saveStats(mode: string, stats: GameStats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(mode), JSON.stringify(stats));
}

export function recordWin(
  mode: string,
  numGuesses: number,
  todayStr: string
): GameStats {
  const stats = loadStats(mode);

  // Prevent double-recording for same day
  if (stats.lastPlayedDate === todayStr) return stats;

  stats.gamesPlayed++;
  stats.gamesWon++;
  stats.lastPlayedDate = todayStr;

  // Streak
  const yesterday = new Date(todayStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (stats.lastPlayedDate === yesterdayStr || stats.currentStreak === 0) {
    stats.currentStreak++;
  } else {
    stats.currentStreak = 1;
  }
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

  // Distribution (index 0 = 1 guess, index 5 = 6 guesses, index 6 = 7+)
  const idx = Math.min(numGuesses - 1, 6);
  stats.guessDistribution[idx]++;

  saveStats(mode, stats);
  return stats;
}

export function recordLoss(mode: string, todayStr: string): GameStats {
  const stats = loadStats(mode);

  if (stats.lastPlayedDate === todayStr) return stats;

  stats.gamesPlayed++;
  stats.currentStreak = 0;
  stats.lastPlayedDate = todayStr;
  stats.guessDistribution[6]++;

  saveStats(mode, stats);
  return stats;
}

export function hasPlayedToday(mode: string, todayStr: string): boolean {
  const stats = loadStats(mode);
  return stats.lastPlayedDate === todayStr;
}
