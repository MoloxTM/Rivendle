import { NextResponse } from "next/server";
import { getDailyData, getTodayString } from "@/lib/daily";
import locations from "@/data/locations.json";

const MAX_ATTEMPTS = 3;
const WIN_THRESHOLD = 200;

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
  return NextResponse.json({
    name: location.name,
    description: location.description,
    region: location.region,
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

  const roundedDistance = Math.round(distance);
  const isCorrect = distance < WIN_THRESHOLD;
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
      ? { correctLat: location.lat, correctLng: location.lng }
      : {}),
  });
}
