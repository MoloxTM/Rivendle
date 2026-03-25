import type { Character, AttributeComparison, GuessResult, AgeDirection, Age } from "./types";

const AGE_ORDER: Record<Age, number> = {
  Jeune: 1,
  Adulte: 2,
  Ancien: 3,
  Immortel: 4,
  Inconnu: -1,
};

function compareSimple(guessed: string, target: string): GuessResult {
  return guessed === target ? "correct" : "wrong";
}

function compareAge(guessed: Age, target: Age): AgeDirection {
  if (guessed === target) return "correct";
  if (AGE_ORDER[guessed] === -1 || AGE_ORDER[target] === -1) return "correct";
  return AGE_ORDER[guessed] < AGE_ORDER[target] ? "higher" : "lower";
}

export function compareCharacters(
  guessed: Character,
  target: Character
): AttributeComparison {
  return {
    race: compareSimple(guessed.race, target.race),
    genre: compareSimple(guessed.genre, target.genre),
    faction: compareSimple(guessed.faction, target.faction),
    arme: compareSimple(guessed.arme, target.arme),
    statut: compareSimple(guessed.statut, target.statut),
    apparition: compareSimple(guessed.apparition, target.apparition),
    age: compareAge(guessed.age, target.age),
  };
}

export function isCorrectGuess(comparison: AttributeComparison): boolean {
  return (
    comparison.race === "correct" &&
    comparison.genre === "correct" &&
    comparison.faction === "correct" &&
    comparison.arme === "correct" &&
    comparison.statut === "correct" &&
    comparison.apparition === "correct" &&
    comparison.age === "correct"
  );
}
