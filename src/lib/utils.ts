import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a free-text prize description. When admins enter a bare number
 * (e.g. "50" or "50.00") prefix it with "$" so participants see the currency.
 * Strips trailing ".00" for whole dollar amounts.
 */
export function formatPrizeDescription(value?: string | null): string {
  const v = (value ?? "").trim();
  if (!v) return "Gift Card";
  // Pure numeric like "50", "50.00", "50.5"
  if (/^\d+(\.\d+)?$/.test(v)) {
    const n = Number(v);
    return `$${Number.isInteger(n) ? n.toString() : n.toFixed(2)}`;
  }
  // Starts with a bare number then text ("50 Bass Pro card")
  const m = v.match(/^(\d+(?:\.\d+)?)(\s+\S.*)$/);
  if (m) {
    const n = Number(m[1]);
    const num = Number.isInteger(n) ? n.toString() : n.toFixed(2);
    return `$${num}${m[2]}`;
  }
  return v;
}
