"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [6500, 9000],
];

function createIcon(color: string, size: number = 14) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const guessIcon = createIcon("#c9a84c", 14);
const correctIcon = createIcon("#538d4e", 20);
const closestIcon = createIcon("#c9a84c", 16);

export interface MapGuess {
  lat: number;
  lng: number;
  distance: number;
}

interface MapLeafletProps {
  guesses: MapGuess[];
  correctPosition: { lat: number; lng: number } | null;
  closestGuess: MapGuess | null;
  won: boolean;
  gameOver: boolean;
  onPlaceGuess: (lat: number, lng: number) => void;
  disabled: boolean;
}

export default function MapLeaflet({
  guesses,
  correctPosition,
  closestGuess,
  won,
  gameOver,
  onPlaceGuess,
  disabled,
}: MapLeafletProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingMarkerRef = useRef<L.Marker | null>(null);
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen]);

  // Invalidate map size after fullscreen toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t1 = setTimeout(() => map.invalidateSize(), 0);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isFullscreen]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomControl: true,
      attributionControl: false,
      maxBounds: [
        [-400, -400],
        [6900, 9400],
      ],
      maxBoundsViscosity: 1.0,
    });

    const imageUrl = "/images/me-terrain.jpg";
    L.imageOverlay(imageUrl, MAP_BOUNDS).addTo(map);
    map.fitBounds(MAP_BOUNDS);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map click
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (disabled) return;

      // Remove previous pending marker
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
      }

      const marker = L.marker(e.latlng, { icon: guessIcon }).addTo(map);
      pendingMarkerRef.current = marker;
      setPendingPos({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [disabled]);

  // Draw guesses, correct position, and connecting line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layers: L.Layer[] = [];

    // During game: show all past guesses as small gold dots
    // At end: show all guesses, highlight closest
    guesses.forEach((g) => {
      const isClosest = closestGuess && g === closestGuess;
      const icon = gameOver && isClosest ? closestIcon : guessIcon;
      const marker = L.marker([g.lat, g.lng], { icon }).addTo(map);
      layers.push(marker);
    });

    // Only show correct position when game is over
    if (gameOver && correctPosition) {
      const marker = L.marker([correctPosition.lat, correctPosition.lng], {
        icon: correctIcon,
      }).addTo(map);
      layers.push(marker);

      // Dashed line from closest guess to correct position
      if (closestGuess) {
        const line = L.polyline(
          [
            [closestGuess.lat, closestGuess.lng],
            [correctPosition.lat, correctPosition.lng],
          ],
          {
            color: won ? "#538d4e" : "#c9a84c",
            weight: 2,
            dashArray: "10, 8",
            opacity: 0.9,
          }
        ).addTo(map);
        layers.push(line);
      }
    }

    return () => {
      layers.forEach((l) => l.remove());
    };
  }, [guesses, correctPosition, closestGuess, won, gameOver]);

  const handleConfirm = useCallback(() => {
    if (!pendingPos) return;
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }
    onPlaceGuess(pendingPos.lat, pendingPos.lng);
    setPendingPos(null);
  }, [pendingPos, onPlaceGuess]);

  return (
    <div
      className={isFullscreen ? "fixed inset-0 z-[9999] bg-background" : "relative w-full"}
    >
      <div
        ref={containerRef}
        className="w-full overflow-hidden"
        style={{
          height: isFullscreen ? "100vh" : "500px",
          background: "#1a1a1a",
          borderRadius: isFullscreen ? 0 : "0.75rem",
          border: isFullscreen ? "none" : "2px solid rgba(255,255,255,0.1)",
        }}
      />

      {/* Fullscreen toggle */}
      <button
        onClick={() => setIsFullscreen((v) => !v)}
        className="absolute top-3 right-3 z-[1001] rounded-md bg-surface/90 border border-white/10 p-2 text-text-dim hover:text-text hover:bg-surface transition-colors backdrop-blur-sm"
        title={isFullscreen ? "Quitter le plein écran (Echap)" : "Plein écran"}
      >
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>

      {/* Confirm button */}
      {pendingPos && !disabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001]">
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-bold text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Deviner ici
          </button>
        </div>
      )}

      {/* Instruction */}
      {!disabled && !pendingPos && guesses.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001]">
          <p className="rounded-lg bg-surface px-4 py-2 text-sm text-text-dim backdrop-blur-md">
            Cliquez sur la carte pour placer votre repère
          </p>
        </div>
      )}
    </div>
  );
}
