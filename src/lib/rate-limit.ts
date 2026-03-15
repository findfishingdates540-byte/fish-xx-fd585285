/**
 * Client-side rate limiter to prevent rapid-fire submissions.
 * Tracks last action time per key and enforces cooldown.
 */

const lastActionTimes = new Map<string, number>();

export function canPerformAction(key: string, cooldownMs: number): boolean {
  const now = Date.now();
  const lastTime = lastActionTimes.get(key) || 0;
  if (now - lastTime < cooldownMs) return false;
  lastActionTimes.set(key, now);
  return true;
}

/**
 * Auth login rate limiter with exponential backoff.
 */
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  waitSeconds: number;
} {
  const now = Date.now();
  const state = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };

  if (state.lockedUntil > now) {
    return {
      allowed: false,
      waitSeconds: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  return { allowed: true, waitSeconds: 0 };
}

export function recordLoginFailure(identifier: string): void {
  const state = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  state.count += 1;

  if (state.count >= 5) {
    // Exponential backoff: 30s, 60s, 120s, etc.
    const backoffMs = Math.min(30000 * Math.pow(2, state.count - 5), 300000);
    state.lockedUntil = Date.now() + backoffMs;
  }

  loginAttempts.set(identifier, state);
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}
