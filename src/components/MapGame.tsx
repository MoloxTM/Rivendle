"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { saveMapGameState, loadMapGameState } from "@/lib/gameState";
import { recordWin, recordLoss } from "@/lib/stats";
import Countdown from "./Countdown";
import type { MapGuess } from "./MapLeaflet";

function distanceEmoji(distance: number): string {
  if (distance < 200) return "🟩";
  if (distance < 600) return "🟨";
  if (distance < 1200) return "🟧";
  return "🟥";
}

const MapLeaflet = dynamic(() => import("./MapLeaflet"), { ssr: false });

const MAX_ATTEMPTS = 3;

export default function MapGame() {
  const [locationName, setLocationName] = useState("");
  const [dayNumber, setDayNumber] = useState(0);
  const [guesses, setGuesses] = useState<MapGuess[]>([]);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctPosition, setCorrectPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tolerance, setTolerance] = useState(200);

  useEffect(() => {
    fetch("/api/daily/map")
      .then((r) => r.json())
      .then((data) => {
        setLocationName(data.name);
        setDayNumber(data.dayNumber);
        if (data.tolerance) setTolerance(data.tolerance);
      });

    const saved = loadMapGameState();
    if (saved) {
      setGuesses(saved.guesses);
      setWon(saved.won);
      setLocationName(saved.locationName);
      if (saved.correctLat && saved.correctLng) {
        setCorrectPosition({ lat: saved.correctLat, lng: saved.correctLng });
      }
      if (saved.won || saved.guesses.length >= MAX_ATTEMPTS) {
        setGameOver(true);
      }
      if (saved.guesses.length > 0) {
        const minDist = Math.min(...saved.guesses.map((g) => g.distance));
        setBestScore(Math.round(5000 * Math.exp(-minDist / 1200)));
      }
    }
    setLoaded(true);
  }, []);

  const handlePlaceGuess = useCallback(
    async (lat: number, lng: number) => {
      if (gameOver) return;

      const attempt = guesses.length + 1;

      const res = await fetch("/api/daily/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, attempt }),
      });
      const data = await res.json();

      const newGuess: MapGuess = { lat, lng, distance: data.distance };
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);

      const minDist = Math.min(...newGuesses.map((g) => g.distance));
      setBestScore(Math.round(5000 * Math.exp(-minDist / 1200)));

      // Add hint if provided
      if (data.hint) {
        setHints((prev) => [...prev, data.hint]);
      }

      const todayStr = new Date().toISOString().split("T")[0];

      if (data.isCorrect) {
        setWon(true);
        setGameOver(true);
        setCorrectPosition({ lat: data.correctLat, lng: data.correctLng });
        if (data.tolerance) setTolerance(data.tolerance);
        recordWin("map", attempt, todayStr);
        saveMapGameState(
          newGuesses,
          true,
          locationName,
          data.correctLat,
          data.correctLng
        );
      } else if (attempt >= MAX_ATTEMPTS) {
        setGameOver(true);
        setCorrectPosition({ lat: data.correctLat, lng: data.correctLng });
        if (data.tolerance) setTolerance(data.tolerance);
        recordLoss("map", todayStr);
        saveMapGameState(
          newGuesses,
          false,
          locationName,
          data.correctLat,
          data.correctLng
        );
      } else {
        saveMapGameState(newGuesses, false, locationName, 0, 0);
      }
    },
    [gameOver, guesses, locationName]
  );

  const handleShare = useCallback(() => {
    const emojiRow = guesses.map((g) => distanceEmoji(g.distance)).join("");
    const result = won ? `🟩 Trouvé en ${guesses.length}/${MAX_ATTEMPTS}` : `❌ Perdu`;
    const text = [
      `Rivendle #${dayNumber} - Carte 🗺️`,
      `📍 ${locationName}`,
      `${result} — Score : ${bestScore ?? 0}/5000`,
      emojiRow,
      `https://rivendle.com/map`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [guesses, won, dayNumber, locationName, bestScore]);

  // Find closest guess for end-game line
  const closestGuess =
    guesses.length > 0
      ? guesses.reduce((best, g) => (g.distance < best.distance ? g : best))
      : null;

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4">
      <p className="text-sm text-text-dim">Rivendle #{dayNumber} - Carte</p>

      {/* Location name to find */}
      {locationName && (
        <div className="text-center">
          <p className="text-text-dim text-sm mb-1">Placez sur la carte :</p>
          <h2
            className="text-2xl font-bold text-gold"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            {locationName}
          </h2>
        </div>
      )}

      {/* Progressive hints */}
      {hints.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {hints.map((hint, i) => (
            <span
              key={i}
              className="rounded-md bg-surface px-3 py-1.5 text-sm text-text-dim border border-white/10 max-w-md text-center"
            >
              {hint}
            </span>
          ))}
        </div>
      )}

      {/* Map */}
      {loaded && (
        <MapLeaflet
          guesses={guesses}
          correctPosition={correctPosition}
          closestGuess={closestGuess}
          won={won}
          gameOver={gameOver}
          onPlaceGuess={handlePlaceGuess}
          disabled={gameOver}
          tolerance={tolerance}
        />
      )}

      {/* Distance feedback during game */}
      {!gameOver && guesses.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-text-dim">
            Essai {guesses.length}/{MAX_ATTEMPTS} —{" "}
            {guesses[guesses.length - 1].distance} lieues
          </p>
        </div>
      )}

      {/* End result */}
      {gameOver && (
        <div className="flex flex-col items-center gap-3">
          {won ? (
            <p className="text-lg font-bold text-correct">
              Bravo ! Vous avez trouvé {locationName} en {guesses.length} essai
              {guesses.length > 1 ? "s" : ""} !
            </p>
          ) : (
            <p className="text-lg font-bold text-[#8b0000]">
              Perdu ! C&apos;était ici : {locationName}
            </p>
          )}

          {bestScore !== null && closestGuess && (
            <p className="text-text-dim text-sm">
              Meilleure distance : {closestGuess.distance} lieues — Score :{" "}
              {bestScore}/5000
            </p>
          )}

          {/* Guess history */}
          <div className="flex flex-wrap justify-center gap-2">
            {guesses.map((g, i) => {
              const isClosest = closestGuess && g === closestGuess;
              return (
                <span
                  key={i}
                  className={`rounded-md px-3 py-1 text-sm ${
                    won && g.distance === closestGuess?.distance
                      ? "bg-correct text-white"
                      : isClosest
                        ? "bg-gold/30 text-gold border border-gold/50"
                        : "bg-wrong text-text"
                  }`}
                >
                  #{i + 1} : {g.distance} lieues
                </span>
              );
            })}
          </div>

          <button
            onClick={handleShare}
            className="rounded-lg border border-white/10 bg-surface px-5 py-2 text-sm font-medium text-text transition-colors hover:bg-white/10"
          >
            {copied ? "✓ Copié !" : "Partager le résultat"}
          </button>

          <Countdown />
        </div>
      )}
    </div>
  );
}
