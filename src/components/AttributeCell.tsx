"use client";

import type { GuessResult, AgeDirection } from "@/lib/types";

interface AttributeCellProps {
  value: string;
  result: GuessResult | AgeDirection;
  delay: number;
  isAge?: boolean;
}

function getResultColor(result: GuessResult | AgeDirection): string {
  switch (result) {
    case "correct":
      return "bg-correct";
    case "partial":
      return "bg-partial";
    case "higher":
    case "lower":
      return "bg-wrong";
    case "wrong":
      return "bg-wrong";
    default:
      return "bg-wrong";
  }
}

function getAgeArrow(result: AgeDirection): string {
  if (result === "higher") return " ↑";
  if (result === "lower") return " ↓";
  return "";
}

export default function AttributeCell({
  value,
  result,
  delay,
  isAge = false,
}: AttributeCellProps) {
  return (
    <div
      className={`animate-flip flex h-12 items-center justify-center rounded-md px-2 text-center text-xs font-medium ${getResultColor(result)} delay-${delay}`}
      style={{ opacity: 0, animationDelay: `${delay * 0.1}s` }}
    >
      <span className="truncate">
        {value}
        {isAge && getAgeArrow(result as AgeDirection)}
      </span>
    </div>
  );
}
