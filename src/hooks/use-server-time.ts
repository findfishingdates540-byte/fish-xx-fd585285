import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so all consumers share one offset (avoids per-component refetch).
let offsetMs = 0;
let lastSync = 0;
let inflight: Promise<void> | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // re-sync every 5 minutes
const listeners = new Set<() => void>();

async function sync() {
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
      listeners.forEach((fn) => fn());
    } catch {
      // Silent fail — fall back to local clock.
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function useServerTime() {
  const [, force] = useState(0);

  useEffect(() => {
    if (Date.now() - lastSync > SYNC_INTERVAL_MS) sync();
    const cb = () => force((n) => n + 1);
    listeners.add(cb);
    const id = setInterval(() => sync(), SYNC_INTERVAL_MS);
    return () => {
      listeners.delete(cb);
      clearInterval(id);
    };
  }, []);

  return { serverNow, offsetMs };
}