import { NextResponse } from "next/server";
import { getDailyData, getTodayString } from "@/lib/daily";
import locations from "@/data/locations.json";

const MAX_ATTEMPTS = 3;
const DEFAULT_TOLERANCE = 200;

function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export async function GET() {
  const today = getTodayString();
  const daily = getDailyData(today);
  const location = locations.find((l) => l.id === daily.mapLocationId);

  if (!location) {
    return NextResponse.json(
      { error: "Location not found" },
      { status: 500 }
    );
  }

  // Return name but NOT coordinates or hints (hints revealed per attempt)
  const locTolerance = (location as { tolerance?: number }).tolerance ?? DEFAULT_TOLERANCE;
  return NextResponse.json({
    name: location.name,
    description: location.description,
    region: location.region,
    tolerance: locTolerance,
    dayNumber: daily.dayNumber,
  });
}

export async function POST(request: Request) {
  const { lat, lng, attempt } = await request.json();
  const today = getTodayString();
  const daily = getDailyData(today);
  const location = locations.find((l) => l.id === daily.mapLocationId);

  if (!location) {
    return NextResponse.json(
      { error: "Location not found" },
      { status: 500 }
    );
  }

  const distance = Math.sqrt(
    Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
  );

  const loc = location as { tolerance?: number; polygon?: [number, number][] };
  const tolerance = loc.tolerance ?? DEFAULT_TOLERANCE;
  const roundedDistance = Math.round(distance);
  const isCorrect = loc.polygon
    ? pointInPolygon(lat, lng, loc.polygon)
    : distance < tolerance;
  const score = Math.round(5000 * Math.exp(-distance / 1200));
  const isLastAttempt = attempt >= MAX_ATTEMPTS;

  // Build hint for next attempt
  let hint: string | null = null;
  if (!isCorrect && !isLastAttempt) {
    if (attempt === 1) {
      hint = `Région : ${location.region}`;
    } else if (attempt === 2) {
      hint = location.description;
    }
  }

  return NextResponse.json({
    distance: roundedDistance,
    score,
    isCorrect,
    hint,
    // Only reveal correct position when game ends
    ...(isCorrect || isLastAttempt
      ? { correctLat: location.lat, correctLng: location.lng, tolerance }
      : {}),
  });
}
