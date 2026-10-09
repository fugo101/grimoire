# Cache Components stays off

Date: 2026-10-09

## Status

Accepted.

## Context

Issue #118 asked whether `cacheComponents` could cache the Public Report at `/p/[code]`, the only screen that might benefit. A spike on Next 16.3.8 answered no. Cache Components is an app-wide flag, so turning it on also takes away the mechanism that stops `next build` from opening `data.db`.

What the spike observed, with `test ! -f data.db` checked after every build:

| Build | Result | `data.db` created |
|---|---|---|
| `main` unchanged | pass | no |
| `force-dynamic` removed from the root layout (control) | **pass** | **yes** |
| `cacheComponents: true` | fail: `Route segment config "dynamic" is not compatible with nextConfig.cacheComponents` | no |
| the same, with `dynamic` removed | fail: every route blocked by the root layout's `cookies()` | **yes** |

The control matters for two reasons. It shows the check can catch a leak, and it shows the build itself never complains about one.

## Decision

Leave `cacheComponents` off, and keep `export const dynamic = "force-dynamic"` on the root layout.

The flag's costs were concrete and app-wide. Its benefit was small and confined to one route:

- **The build-time guard has no config-level replacement.** Under Cache Components `export const dynamic` is a compile error, and "dynamic by default" does not stop a prerender from running synchronous `better-sqlite3` queries. The Next docs say so directly (`connection.md`, `caching.md`). The only remaining guard is to put `connection()` (or another dynamic await) in front of *every* query entry point. That is a convention spread across many files, and nothing enforces it. A missed call surfaces only in CI's `test ! -f data.db`, never as a build error.
- **The spike found actual leaks, not only theoretical ones.** The three `/dashboard/manage/*` pages query before any dynamic await, so they opened the database at build. `/api/health` was prerendered into a static `{"ok":true}`, so the healthcheck would have stopped touching SQLite and reported healthy against a broken database.
- **The nonce-based CSP rules out static shells.** The Next docs say this outright: "Partial Prerendering (PPR) is incompatible with nonce-based CSP" (`content-security-policy.md`). Cache Components makes PPR the default, so any route that emitted a shell would ship framework scripts the CSP in `src/proxy.ts` blocks.
- **The theme cookie sets an attribute on `<html>`.** Under Cache Components that makes every segment beneath the root layout request-bound. There is no child to wrap in `<Suspense>`.
- **The one route that would benefit gains almost nothing.** A Public Report must always reflect current data. Its cache would therefore be invalidated on every change to a Transaction, Purpose or Share Link, and at this app's traffic level it would almost never be read before being thrown away.

## Revisit when

All three of these hold at once. Do not revisit because one of them changes:

1. The CSP no longer depends on a per-request nonce (for example, hash/SRI-based).
2. The theme is no longer read from a cookie on the server to set an attribute on `<html>`.
3. "Every query sits behind a dynamic await" is enforced by something that fails a check, not just written down as a convention.
