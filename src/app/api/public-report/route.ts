import { getPublicReport } from "@/server/public-report.queries";
import { SHARE_CODE_SHAPE } from "@/lib/schemas";
import {
  fromURLSearchParams,
  readPublicReportRequest,
} from "@/lib/search-params";

/**
 * Deliberately unauthenticated, like `login` — this is a public share link's
 * own data, gated by the code itself rather than a session. No origin check
 * either: nothing here depends on a cookie a cross-site request could ride
 * along, so there is nothing for that check to protect.
 *
 * The view filters go through the same parser `/p/[code]/page.tsx` uses, so
 * a reader's refetch filters exactly as their first load did. The code alone
 * is checked strictly: a value that could never be a code is a bad request.
 */
export async function GET(request: Request) {
  const { code, search } = readPublicReportRequest(
    fromURLSearchParams(new URL(request.url).searchParams)
  );
  if (!code || !SHARE_CODE_SHAPE.test(code)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const report = await getPublicReport({ ...search, code });
  if (!report) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(report);
}
