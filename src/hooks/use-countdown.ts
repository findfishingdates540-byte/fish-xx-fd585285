import { useEffect, useState } from "react";
import { useServerTime, serverNow } from "./use-server-time";

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

function compute(targetDate: string): CountdownValue {
  const diff = new Date(targetDate).getTime() - serverNow();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
  }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
    expired: false,
  };
}

/**
 * Shared countdown hook driven by serverNow() (server-synced clock).
 * @param targetDate ISO date string
 * @param intervalMs tick interval — default 1000ms
 */
export function useCountdown(targetDate: string, intervalMs: number = 1000): CountdownValue {
  useServerTime();
  const [value, setValue] = useState<CountdownValue>(() => compute(targetDate));

  useEffect(() => {
    setValue(compute(targetDate));
    const id = setInterval(() => setValue(compute(targetDate)), intervalMs);
    return () => clearInterval(id);
  }, [targetDate, intervalMs]);

  return value;
}