export type Race =
  | "Homme"
  | "Hobbit"
  | "Elfe"
  | "Nain"
  | "Maia"
  | "Orc"
  | "Ent"
  | "Araignee"
  | "Dragon"
  | "Autre";

export type Faction =
  | "Communaute"
  | "Gondor"
  | "Rohan"
  | "Mordor"
  | "Isengard"
  | "Lothlorien"
  | "Fondcombe"
  | "Comte"
  | "Erebor"
  | "Mirkwood"
  | "Royaume Sylvestre"
  | "Autre";

export type Arme =
  | "Epee"
  | "Arc"
  | "Hache"
  | "Baton"
  | "Magie"
  | "Anneau"
  | "Aucune"
  | "Autre";

export type Statut = "Vivant" | "Mort" | "Immortel" | "Ambigu";

export type Apparition =
  | "SdA"
  | "Hobbit"
  | "Les deux"
  | "Silmarillion"
  | "Anneaux de Pouvoir";

export type Genre = "Masculin" | "Feminin" | "Inconnu";

export type Age = "Jeune" | "Adulte" | "Ancien" | "Immortel" | "Inconnu";

export interface Character {
  id: string;
  name: string;
  race: Race;
  genre: Genre;
  faction: Faction;
  arme: Arme;
  statut: Statut;
  apparition: Apparition;
  age: Age;
  image: string;
}

export interface Quote {
  id: string;
  text: string;
  characterId: string;
  source: string;
}

export interface ImageClue {
  id: string;
  characterId: string;
  src: string;
  alt: string;
}

export type GuessResult = "correct" | "partial" | "wrong";

export type AgeDirection = "correct" | "higher" | "lower";

export interface AttributeComparison {
  race: GuessResult;
  genre: GuessResult;
  faction: GuessResult;
  arme: GuessResult;
  statut: GuessResult;
  apparition: GuessResult;
  age: AgeDirection;
}

export interface GuessEntry {
  character: Character;
  comparison: AttributeComparison;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDate: string;
}

export interface DailyData {
  classicCharacterId: string;
  quoteId: string;
  imageId: string;
  dayNumber: number;
}
