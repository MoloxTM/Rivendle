import { NextResponse } from "next/server";
import { getDailyData, getTodayString } from "@/lib/daily";
import characters from "@/data/characters.json";
import quotes from "@/data/quotes.json";
import hints from "@/data/hints.json";
import type { Character, AttributeComparison } from "@/lib/types";
import { compareCharacters } from "@/lib/game";

export async function GET() {
  const today = getTodayString();
  const daily = getDailyData(today);

  return NextResponse.json({
    dayNumber: daily.dayNumber,
    characters: characters.map((c) => ({ id: c.id, name: c.name })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { mode, guessId, guessCount } = body as {
    mode: string;
    guessId: string;
    guessCount?: number;
  };

  const today = getTodayString();
  const daily = getDailyData(today);

  if (mode === "classic") {
    const target = characters.find(
      (c) => c.id === daily.classicCharacterId
    ) as Character;
    const guessed = characters.find((c) => c.id === guessId) as Character;

    if (!guessed) {
      return NextResponse.json({ error: "Unknown character" }, { status: 400 });
    }

    const comparison: AttributeComparison = compareCharacters(guessed, target);
    const isCorrect = guessed.id === target.id;

    // Build hints based on guess count (after this guess)
    const totalGuesses = (guessCount ?? 0) + 1;
    const unlockedHints: { type: string; label: string; content: string }[] = [];
    const charHints = hints[target.id as keyof typeof hints];

    if (totalGuesses >= 6) {
      const charQuote = quotes.find((q) => q.characterId === target.id);
      if (charQuote) {
        unlockedHints.push({
          type: "quote",
          label: "Citation",
          content: charQuote.text,
        });
      } else if (charHints) {
        // Fallback: use description as first hint if no quote
        unlockedHints.push({
          type: "quote",
          label: "Citation",
          content: "Aucune citation connue pour ce personnage.",
        });
      }
    }
    if (charHints && totalGuesses >= 12) {
      unlockedHints.push({
        type: "description",
        label: "Description",
        content: charHints.description,
      });
    }
    if (charHints && totalGuesses >= 18) {
      unlockedHints.push({
        type: "initials",
        label: "Initiales",
        content: charHints.initials,
      });
    }

    return NextResponse.json({
      comparison,
      isCorrect,
      guessedCharacter: guessed,
      hints: unlockedHints,
      ...(isCorrect && { answer: target }),
    });
  }

  if (mode === "quote") {
    const targetQuote = quotes.find((q) => q.id === daily.quoteId);
    if (!targetQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 500 });
    }

    const targetChar = characters.find(
      (c) => c.id === targetQuote.characterId
    ) as Character;

    const isCorrect = guessId === targetQuote.characterId;

    // Quote mode hints based on guess count
    const totalGuesses = (guessCount ?? 0) + 1;
    const quoteHints: { type: string; label: string; content: string }[] = [];

    if (totalGuesses >= 6) {
      quoteHints.push({
        type: "apparition",
        label: "Apparition",
        content: targetChar.apparition,
      });
    }
    if (totalGuesses >= 12) {
      quoteHints.push({
        type: "race",
        label: "Race",
        content: targetChar.race,
      });
    }

    return NextResponse.json({
      isCorrect,
      hints: quoteHints,
      ...(isCorrect && {
        answer: {
          characterId: targetQuote.characterId,
          characterName: targetChar.name,
        },
      }),
    });
  }

  if (mode === "image") {
    const isCorrect = guessId === daily.imageId;
    const targetChar = characters.find((c) => c.id === daily.imageId);

    return NextResponse.json({
      isCorrect,
      ...(isCorrect && { answer: targetChar }),
    });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
