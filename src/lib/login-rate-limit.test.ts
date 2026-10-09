import { describe, expect, it } from "vitest";
import {
  LOGIN_WINDOW_MS,
  MAX_TRACKED_KEYS,
  checkLoginRateLimit,
  clearLoginAttempts,
  createLoginAttemptStore,
  recordLoginFailure,
} from "@/lib/login-rate-limit";

const KEY = "203.0.113.7";
const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

/** `count` failures for `key`, one a minute from `start` onward. */
function fail(
  store: ReturnType<typeof createLoginAttemptStore>,
  count: number,
  { key = KEY, start = T0 } = {}
) {
  for (let i = 0; i < count; i++) {
    recordLoginFailure(key, { store, now: start + i * MINUTE });
  }
}

describe("login rate limit", () => {
  it("still allows a client after 9 failures (positive control)", () => {
    const store = createLoginAttemptStore();
    fail(store, 9);
    expect(checkLoginRateLimit(KEY, { store, now: T0 + 9 * MINUTE })).toEqual({
      allowed: true,
    });
  });

  it("blocks after the 10th failure until 15 minutes past the first", () => {
    const store = createLoginAttemptStore();
    fail(store, 10);
    // First failure at T0, so the window closes at T0 + 15 min: 6 minutes
    // after the tenth failure, which landed at T0 + 9 min.
    expect(checkLoginRateLimit(KEY, { store, now: T0 + 9 * MINUTE })).toEqual({
      allowed: false,
      retryAfterMs: 6 * MINUTE,
    });
  });

  it("allows the client again exactly when the window closes", () => {
    const store = createLoginAttemptStore();
    fail(store, 10);
    const closes = T0 + LOGIN_WINDOW_MS;
    expect(checkLoginRateLimit(KEY, { store, now: closes - 1 }).allowed).toBe(
      false
    );
    expect(checkLoginRateLimit(KEY, { store, now: closes })).toEqual({
      allowed: true,
    });
  });

  it("does not extend the lockout for attempts made while blocked", () => {
    const store = createLoginAttemptStore();
    fail(store, 10);
    fail(store, 5, { start: T0 + 10 * MINUTE });
    expect(
      checkLoginRateLimit(KEY, { store, now: T0 + LOGIN_WINDOW_MS })
    ).toEqual({ allowed: true });
  });

  it("starts over when the clock steps backwards", () => {
    const store = createLoginAttemptStore();
    fail(store, 10);
    expect(checkLoginRateLimit(KEY, { store, now: T0 - MINUTE })).toEqual({
      allowed: true,
    });
  });

  it("forgets every failure once cleared", () => {
    const store = createLoginAttemptStore();
    fail(store, 9);
    clearLoginAttempts(KEY, { store });
    fail(store, 9, { start: T0 + 9 * MINUTE });
    expect(checkLoginRateLimit(KEY, { store, now: T0 + 14 * MINUTE })).toEqual({
      allowed: true,
    });
  });

  it("counts each client separately", () => {
    const store = createLoginAttemptStore();
    fail(store, 10);
    expect(
      checkLoginRateLimit("198.51.100.1", { store, now: T0 + 9 * MINUTE })
    ).toEqual({ allowed: true });
  });

  describe("memory bound", () => {
    /** One failure each for `count` distinct throwaway keys. */
    function flood(
      store: ReturnType<typeof createLoginAttemptStore>,
      count: number,
      now: number,
      prefix = "flood"
    ) {
      for (let i = 0; i < count; i++) {
        recordLoginFailure(`${prefix}-${i}`, { store, now });
      }
    }

    it("never tracks more than MAX_TRACKED_KEYS clients", () => {
      const store = createLoginAttemptStore();
      flood(store, MAX_TRACKED_KEYS + 100, T0);
      expect(store.size).toBeLessThanOrEqual(MAX_TRACKED_KEYS);
    });

    it("sweeps expired windows before evicting a live one", () => {
      const store = createLoginAttemptStore();
      flood(store, MAX_TRACKED_KEYS, T0, "old");
      recordLoginFailure("new", { store, now: T0 + LOGIN_WINDOW_MS });
      expect(store.size).toBe(1);
    });

    it("evicts the least recently seen client, not one still hammering", () => {
      const store = createLoginAttemptStore();
      fail(store, 10, { key: "idle" });
      fail(store, 10, { key: "hammering" });
      const now = T0 + 10 * MINUTE;
      flood(store, MAX_TRACKED_KEYS - 2, now);

      // Refused, but still seen: this must count as recent use, or a flood
      // of fresh keys would push the attacker's own lockout out of memory.
      checkLoginRateLimit("hammering", { store, now });
      flood(store, 100, now, "late");

      expect(checkLoginRateLimit("hammering", { store, now }).allowed).toBe(
        false
      );
      expect(checkLoginRateLimit("idle", { store, now })).toEqual({
        allowed: true,
      });
    });
  });
});
