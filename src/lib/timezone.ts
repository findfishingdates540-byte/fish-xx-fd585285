/**
 * Returns the UTC millisecond timestamp that corresponds to midnight
 * (00:00:00) on the given calendar date in the given IANA timezone.
 *
 * Example: localMidnightUtcMs("2026-05-20", "America/New_York") returns
 * the UTC ms for May 20, 2026 00:00 EDT (= 04:00 UTC).
 */
export function localMidnightUtcMs(dateStr: string, timeZone: string): number {
  // Accept "YYYY-MM-DD" or full ISO; take just the date portion.
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  // First guess: treat the local date as if it were UTC midnight.
  const guessUtc = Date.UTC(y, m - 1, d, 0, 0, 0);
  // Find what wall-clock time `guessUtc` shows in the target timezone.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(guessUtc));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  let hour = get("hour");
  if (hour === 24) hour = 0; // some runtimes report 24 for midnight
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  const offsetMs = asUtc - guessUtc; // timezone offset from UTC at that moment
  return guessUtc - offsetMs;
}

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}