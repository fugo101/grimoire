import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getTransactionsRoute } from "@/app/api/transactions/route";
import { GET as getOverviewRoute } from "@/app/api/overview/route";
import { GET as getPublicReportRoute } from "@/app/api/public-report/route";
import { getTransactions } from "@/lib/db/queries";
import {
  overviewQueryOptions,
  publicReportQueryOptions,
  transactionsQueryOptions,
} from "@/lib/query-options";
import type { TransactionSearch } from "@/lib/search-params";
import { getOverview } from "@/server/overview.queries";
import { getPublicReport } from "@/server/public-report.queries";
import {
  FUNDING,
  PURPOSE,
  SHARE_CODE,
  TXN,
  seedTwoDimensions,
} from "@/test/fixtures";
import { withTempDatabase } from "@/test/temp-db";

/**
 * A read reaches the database two ways. During SSR the `page.tsx` calls the
 * server function directly; after that, every refetch goes from the browser's
 * `queryFn` through `fetchJson` to a Route Handler. Each side spells the
 * parameter names on its own, and zod strips a name it does not know, so a
 * filter dropped on the second hop is not an error: the client's first refetch
 * just comes back unfiltered under a URL and chips that still say "filtered".
 *
 * These tests drive that second hop end to end — the URL the client actually
 * builds, handed to the real `GET` — and hold it to two things: it returns
 * exactly the rows the fixture says it should (independent of either side),
 * and it agrees with what the page's direct call returns for the same search.
 * Each filter gets its own case so that losing any one of them fails one.
 */
// `queryOptions` is an identity function for types; the real package pulls in
// React's client context, which the server project's "react-server" condition
// strips out. Nothing under test lives in it.
vi.mock("@tanstack/react-query", () => ({
  queryOptions: <T>(options: T) => options,
}));

vi.mock("@/server/auth-guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth-guard")>();
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({ sub: "admin" }),
  };
});

withTempDatabase("read-parity-test", seedTwoDimensions);

let requested: string | undefined;

beforeEach(() => {
  requested = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      requested = String(input);
      return Response.json(null);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Runs a `queryFn` against the stubbed fetch and returns the URL it asked for. */
async function urlRequestedBy(options: { queryFn?: unknown }): Promise<string> {
  await (options.queryFn as (ctx: never) => Promise<unknown>)({} as never);
  if (!requested) throw new Error("queryFn made no request");
  return requested;
}

async function callRoute(
  handler: (request: Request) => Promise<Response>,
  url: string
) {
  const response = await handler(new Request(new URL(url, "http://localhost")));
  return { status: response.status, body: await response.json() };
}

/** What crossing the wire does to a value: Response.json drops undefined. */
function overTheWire<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value));
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();

/** One case per filter, each narrowing to rows the fixture names outright. */
const FILTER_CASES: {
  name: string;
  search: TransactionSearch;
  dashboard: string[];
  publicReport: string[];
}[] = [
  {
    name: "fromMonth",
    search: { fromMonth: "2026-03" },
    dashboard: [TXN.marXA.id],
    publicReport: [TXN.marXA.id],
  },
  {
    name: "toMonth",
    search: { toMonth: "2026-01" },
    dashboard: [TXN.janXA.id],
    publicReport: [TXN.janXA.id],
  },
  {
    name: "purpose",
    search: { purpose: PURPOSE.y },
    dashboard: [TXN.febYA.id],
    publicReport: [TXN.febYA.id],
  },
  {
    name: "fundingSource",
    search: { fundingSource: FUNDING.b },
    dashboard: [TXN.febXB.id],
    publicReport: [TXN.febXB.id],
  },
];

describe("transactions: client URL → Route Handler", () => {
  it.each(FILTER_CASES)(
    "honours $name the same way the page's direct call does",
    async ({ search, dashboard }) => {
      const url = await urlRequestedBy(transactionsQueryOptions(search));
      const { status, body } = await callRoute(getTransactionsRoute, url);

      expect(status).toBe(200);
      expect(ids(body)).toEqual([...dashboard].sort());
      expect(body).toEqual(overTheWire(await getTransactions(search)));
    }
  );

  it("returns every row when nothing is filtered (control for the cases above)", async () => {
    const url = await urlRequestedBy(transactionsQueryOptions({}));
    const { body } = await callRoute(getTransactionsRoute, url);

    expect(body).toHaveLength(Object.keys(TXN).length);
  });

  it("treats a malformed month as no bound, as the page does, rather than a 400", async () => {
    // Hand-written: the app's own client never sends a month its parser
    // rejected. Lenient on purpose, matching `readTransactionSearch` on the page.
    const { status, body } = await callRoute(
      getTransactionsRoute,
      "/api/transactions?fromMonth=2026-13&purpose=" + PURPOSE.y
    );

    expect(status).toBe(200);
    // The bad bound is dropped, the good filter beside it still applies.
    expect(ids(body)).toEqual([TXN.febYA.id]);
  });
});

describe("overview: client URL → Route Handler", () => {
  it("returns the month the client asked for, as the page's direct call does", async () => {
    const url = await urlRequestedBy(overviewQueryOptions("2026-01"));
    const { status, body } = await callRoute(getOverviewRoute, url);

    expect(status).toBe(200);
    expect(body.month).toBe("2026-01");
    expect(body.total).toBe(TXN.janXA.amount);
    expect(body).toEqual(overTheWire(await getOverview("2026-01")));
  });

  it("returns a different month for a different request (control)", async () => {
    const url = await urlRequestedBy(overviewQueryOptions("2026-03"));
    const { body } = await callRoute(getOverviewRoute, url);

    expect(body.total).toBe(TXN.marXA.amount);
  });

  it("rejects a request with no month, which the app's client never sends", async () => {
    expect((await callRoute(getOverviewRoute, "/api/overview")).status).toBe(
      400
    );
    // Control: the same route, given a month, answers.
    expect(
      (await callRoute(getOverviewRoute, "/api/overview?month=2026-02")).status
    ).toBe(200);
  });
});

describe("public report: client URL → Route Handler", () => {
  it.each(FILTER_CASES)(
    "honours $name the same way the page's direct call does",
    async ({ search, publicReport }) => {
      const url = await urlRequestedBy(
        publicReportQueryOptions(SHARE_CODE, search)
      );
      const { status, body } = await callRoute(getPublicReportRoute, url);

      expect(status).toBe(200);
      expect(ids(body.transactions)).toEqual([...publicReport].sort());
      expect(body).toEqual(
        overTheWire(await getPublicReport({ ...search, code: SHARE_CODE }))
      );
    }
  );

  it("returns the link's whole scope when nothing is filtered (control)", async () => {
    const url = await urlRequestedBy(publicReportQueryOptions(SHARE_CODE, {}));
    const { body } = await callRoute(getPublicReportRoute, url);

    // Mục Z sits outside the link's scope, so its row never appears.
    expect(body.transactions).toHaveLength(Object.keys(TXN).length - 1);
  });

  it("answers 404 for a code that names no link", async () => {
    const url = await urlRequestedBy(
      publicReportQueryOptions("no-such-code", {})
    );
    const { status } = await callRoute(getPublicReportRoute, url);

    expect(status).toBe(404);
  });

  it("rejects a value that could never be a share code", async () => {
    expect(
      (
        await callRoute(
          getPublicReportRoute,
          "/api/public-report?code=no%20way"
        )
      ).status
    ).toBe(400);
    expect(
      (await callRoute(getPublicReportRoute, "/api/public-report")).status
    ).toBe(400);
    // Control: a well-formed code is let through.
    expect(
      (
        await callRoute(
          getPublicReportRoute,
          `/api/public-report?code=${SHARE_CODE}`
        )
      ).status
    ).toBe(200);
  });

  it("never lets a Purpose outside the link's scope narrow or widen it (ADR-0002)", async () => {
    // Mục Z is real and has a row, but the link does not cover it. Asking for
    // it falls back to the link's own scope instead of showing Z's row.
    const url = await urlRequestedBy(
      publicReportQueryOptions(SHARE_CODE, { purpose: PURPOSE.z })
    );
    const { status, body } = await callRoute(getPublicReportRoute, url);

    expect(status).toBe(200);
    expect(ids(body.transactions)).not.toContain(TXN.febZA.id);
    expect(body.transactions).toHaveLength(Object.keys(TXN).length - 1);
  });
});
