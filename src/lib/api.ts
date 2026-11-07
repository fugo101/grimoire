export class ApiUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "ApiUnauthorizedError";
  }
}

/**
 * Shared client for every Route Handler read. Only ever called from the
 * browser: `query-options.ts`'s `queryFn`s run there exclusively — RSC pages
 * prefetch by calling the underlying `lib/db/queries.ts` / `server/*.queries.ts`
 * function directly instead of going through this, since a Server Component
 * calling this would be a self-fetch back to the same server rather than a
 * plain function call.
 *
 * `params` comes from `search-params.ts`, never built inline: that module is
 * where each parameter's name is written, for this request and for the page
 * that reads the same URL.
 */
export async function fetchJson<T>(
  path: string,
  params?: URLSearchParams
): Promise<T> {
  const qs = params?.toString();
  const res = await fetch(qs ? `${path}?${qs}` : path);
  if (res.status === 401) throw new ApiUnauthorizedError();
  if (!res.ok) {
    throw new Error(`${path} responded with ${res.status}`);
  }
  return res.json() as Promise<T>;
}
