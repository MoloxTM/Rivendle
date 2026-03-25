import { NextResponse } from "next/server";
import { getDailyData, getTodayString } from "@/lib/daily";
import characters from "@/data/characters.json";

export async function GET() {
  const today = getTodayString();
  const daily = getDailyData(today);
  const character = characters.find((c) => c.id === daily.imageId);

  if (!character) {
    return NextResponse.json(
      { error: "Character not found" },
      { status: 500 }
    );
  }

  // Return image path but NOT the character name
  return NextResponse.json({
    image: character.image,
    dayNumber: daily.dayNumber,
  });
}
