import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so all consumers share one offset (avoids per-component refetch).
const STORAGE_KEY = "fishx:server-time-offset";
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // re-sync every 5 minutes
const STALE_AFTER_MS = 15 * 60 * 1000; // mark as degraded after 15 min without sync

let offsetMs = 0;
let lastSync = 0;
let hasEverSynced = false;
let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

// Restore last known offset from previous session.
try {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.offsetMs === "number" && typeof parsed?.lastSync === "number") {
        offsetMs = parsed.offsetMs;
        lastSync = parsed.lastSync;
        hasEverSynced = true;
      }
    }
  }
} catch {}

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOnline = true;
    sync();
    notify();
  });
  window.addEventListener("offline", () => {
    isOnline = false;
    notify();
  });
}

async function sync() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const t0 = Date.now();
      const { data, error } = await supabase.functions.invoke("server-time");
      const t1 = Date.now();
      if (error || !data?.now) return;
      // Adjust for round-trip latency (assume symmetric).
      const serverNow = Number(data.now) + (t1 - t0) / 2;
      offsetMs = serverNow - t1;
      lastSync = t1;
      hasEverSynced = true;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ offsetMs, lastSync }));
      } catch {}
      notify();
    } catch {
      // Silent fail — keep last known offset; degraded badge will surface.
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function getServerTimeStatus(): {
  online: boolean;
  synced: boolean;
  stale: boolean;
  degraded: boolean;
  lastSync: number;
} {
  const stale = !lastSync || Date.now() - lastSync > STALE_AFTER_MS;
  const online = isOnline;
  return {
    online,
    synced: hasEverSynced,
    stale,
    degraded: !online || !hasEverSynced || stale,
    lastSync,
  };
}

export function useServerTime() {
  const [, force] = useState(0);

  useEffect(() => {
    if (Date.now() - lastSync > SYNC_INTERVAL_MS) sync();
    const cb = () => force((n) => n + 1);
    listeners.add(cb);
    const id = setInterval(() => sync(), SYNC_INTERVAL_MS);
    // Also re-evaluate degraded state periodically.
    const tick = setInterval(() => force((n) => n + 1), 30_000);
    return () => {
      listeners.delete(cb);
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  return { serverNow, offsetMs, status: getServerTimeStatus() };
}