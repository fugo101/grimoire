import { guardApiRequest } from "@/server/http-auth";
import { getOverview } from "@/server/overview.queries";
import { fromURLSearchParams, readOverviewSearch } from "@/lib/search-params";

/**
 * Same parser as `/dashboard/page.tsx`. The page falls back to the current
 * month when none is given; this route has no such default, because the
 * client always sends the month it is showing — a request without one is not
 * one the app made.
 */
export async function GET(request: Request) {
  const denied = await guardApiRequest(request);
  if (denied) return denied;

  const { month } = readOverviewSearch(
    fromURLSearchParams(new URL(request.url).searchParams)
  );
  if (!month) {
    return Response.json({ error: "invalid_month" }, { status: 400 });
  }

  return Response.json(await getOverview(month));
}
