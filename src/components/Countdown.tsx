"use client";

import { useState, useEffect } from "react";

function getTimeUntilMidnight(): { h: number; m: number; s: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return { h, m, s };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function Countdown() {
  const [time, setTime] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs uppercase tracking-wider text-text-dim">
        Prochain Rivendle dans
      </p>
      <p
        className="text-2xl font-bold tabular-nums text-gold"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </p>
    </div>
  );
}
