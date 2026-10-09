/** Failed logins one client may make inside a window before being refused. */
const MAX_LOGIN_FAILURES = 10;

/** How long a window lasts, counted from the first failure in it. */
export const LOGIN_WINDOW_MS = 15 * 60_000;

/**
 * Clients tracked at once. Real traffic is one admin; this only bites under a
 * flood of distinct addresses, where it caps the store at well under 1MB.
 */
export const MAX_TRACKED_KEYS = 4096;

/**
 * A fixed window anchored to the client's first failure: two numbers per key
 * rather than a growing log of timestamps, which matters on a small swapless
 * box. A sliding log would only differ at the window edge, and anchoring to
 * the first failure rather than to the wall clock means there is no shared
 * boundary to burst across either.
 */
type AttemptRecord = { count: number; windowStart: number };

export type LoginAttemptStore = Map<string, AttemptRecord>;

export function createLoginAttemptStore(): LoginAttemptStore {
  return new Map();
}

/**
 * Kept on `globalThis` for the same reason as the SQLite handle in
 * `src/lib/db/index.ts`: under `next dev` every HMR reload re-evaluates this
 * module, and a module-level Map would silently reset the counters each time.
 */
const globalRef = globalThis as typeof globalThis & {
  __grimoireLoginAttempts?: LoginAttemptStore;
};

type Options = { now?: number; store?: LoginAttemptStore };

function withDefaults(opts: Options | undefined) {
  return {
    now: opts?.now ?? Date.now(),
    store:
      opts?.store ??
      (globalRef.__grimoireLoginAttempts ??= createLoginAttemptStore()),
  };
}

function isExpired(record: AttemptRecord, now: number): boolean {
  // Past the window — or the clock stepped backwards, which leaves the record
  // unanchored. Either way it no longer describes a window.
  return (
    now < record.windowStart || now >= record.windowStart + LOGIN_WINDOW_MS
  );
}

/** The key's record if its window is still open; an expired one is dropped. */
function liveRecord(
  store: LoginAttemptStore,
  key: string,
  now: number
): AttemptRecord | undefined {
  const record = store.get(key);
  if (!record) return undefined;
  if (isExpired(record, now)) {
    store.delete(key);
    return undefined;
  }
  return record;
}

/**
 * A Map iterates in insertion order, so re-inserting on every touch keeps it
 * in least-recently-used order and `keys().next()` is the eviction victim.
 */
function touch(store: LoginAttemptStore, key: string, record: AttemptRecord) {
  store.delete(key);
  store.set(key, record);
}

/**
 * Called only on the path that adds a key — the only one that can grow the
 * store. Pruning there instead of on a timer means no `setInterval` holding
 * the event loop open or duplicating itself on every HMR reload; the work
 * happens exactly when it matters, during a flood.
 */
function makeRoom(store: LoginAttemptStore, now: number) {
  if (store.size < MAX_TRACKED_KEYS) return;
  for (const [key, record] of store) {
    if (isExpired(record, now)) store.delete(key);
  }
  while (store.size >= MAX_TRACKED_KEYS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function checkLoginRateLimit(
  key: string,
  opts?: Options
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const { now, store } = withDefaults(opts);
  const record = liveRecord(store, key, now);
  if (!record || record.count < MAX_LOGIN_FAILURES) return { allowed: true };
  // Refused, but still seen: move it to the most-recent end, or a flood of
  // fresh keys would evict the attacker's own lockout and release them early.
  touch(store, key, record);
  return {
    allowed: false,
    retryAfterMs: record.windowStart + LOGIN_WINDOW_MS - now,
  };
}

export function recordLoginFailure(key: string, opts?: Options): void {
  const { now, store } = withDefaults(opts);
  const record = liveRecord(store, key, now);
  if (!record) makeRoom(store, now);
  touch(
    store,
    key,
    record
      ? { count: record.count + 1, windowStart: record.windowStart }
      : { count: 1, windowStart: now }
  );
}

/** A successful login wipes the client's slate, not just its current window. */
export function clearLoginAttempts(key: string, opts?: Options): void {
  withDefaults(opts).store.delete(key);
}
