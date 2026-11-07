import { guardApiRequest } from "@/server/http-auth";
import { getTransactions } from "@/lib/db/queries";
import {
  fromURLSearchParams,
  readTransactionSearch,
} from "@/lib/search-params";

/**
 * Reads its URL with the same parser `/dashboard/transactions/page.tsx` uses,
 * so the client's refetch and the page's SSR prefetch cannot disagree on what
 * a parameter is called — `app/api/read-parity.test.ts` holds them to that.
 * Lenient like the page: a malformed month means "no bound", not a 400.
 */
export async function GET(request: Request) {
  const denied = await guardApiRequest(request);
  if (denied) return denied;

  const search = readTransactionSearch(
    fromURLSearchParams(new URL(request.url).searchParams)
  );
  return Response.json(await getTransactions(search));
}
