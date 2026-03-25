import { NextResponse } from "next/server";
import { getDailyData, getTodayString } from "@/lib/daily";
import quotes from "@/data/quotes.json";

export async function GET() {
  const today = getTodayString();
  const daily = getDailyData(today);
  const quote = quotes.find((q) => q.id === daily.quoteId);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 500 });
  }

  // Return quote text but NOT the character
  return NextResponse.json({
    text: quote.text,
    source: quote.source,
    dayNumber: daily.dayNumber,
  });
}
