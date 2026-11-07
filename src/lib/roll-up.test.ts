import { describe, expect, it } from "vitest";
import { rollUpByPurpose } from "@/lib/roll-up";
import type { TransactionRow } from "@/lib/types";

let seq = 0;
function row(
  purpose: [id: string, name: string],
  fundingSource: [id: string, name: string],
  amount: number
): TransactionRow {
  seq += 1;
  return {
    id: `tx-${seq}`,
    amount,
    note: "",
    date: "2026-02-01T00:00",
    purposeId: purpose[0],
    purposeName: purpose[1],
    fundingSourceId: fundingSource[0],
    fundingSourceName: fundingSource[1],
    createdAt: "2026-02-01T00:00:00.000Z",
  };
}

const PURPOSE_A: [string, string] = ["p-a", "Purpose A"];
const PURPOSE_B: [string, string] = ["p-b", "Purpose B"];
const SOURCE_A: [string, string] = ["f-a", "Source A"];
const SOURCE_B: [string, string] = ["f-b", "Source B"];

describe("rollUpByPurpose", () => {
  it("gives each Purpose its Gross cost and a Funding split that adds back up to it", () => {
    const totals = rollUpByPurpose([
      row(PURPOSE_A, SOURCE_A, 100_000),
      row(PURPOSE_A, SOURCE_B, 30_000),
      row(PURPOSE_A, SOURCE_A, 20_000),
    ]);

    expect(totals).toEqual([
      {
        id: "p-a",
        name: "Purpose A",
        total: 150_000,
        byFundingSource: [
          { id: "f-a", name: "Source A", total: 120_000 },
          { id: "f-b", name: "Source B", total: 30_000 },
        ],
      },
    ]);
  });

  it("keeps two Purposes apart when they share a name, because a Purpose is its id", () => {
    const twin: [string, string] = ["p-a2", PURPOSE_A[1]];

    const totals = rollUpByPurpose([
      row(PURPOSE_A, SOURCE_A, 100_000),
      row(twin, SOURCE_A, 40_000),
    ]);

    expect(totals.map((t) => [t.id, t.total])).toEqual([
      ["p-a", 100_000],
      ["p-a2", 40_000],
    ]);
  });

  it("merges rows of one Purpose even when they carry different names", () => {
    const renamed: [string, string] = [PURPOSE_A[0], "Purpose A, renamed"];

    const totals = rollUpByPurpose([
      row(PURPOSE_A, SOURCE_A, 100_000),
      row(renamed, SOURCE_A, 40_000),
    ]);

    expect(totals.map((t) => [t.id, t.total])).toEqual([["p-a", 140_000]]);
  });

  it("orders Purposes, and each Funding split, by largest first", () => {
    const totals = rollUpByPurpose([
      row(PURPOSE_A, SOURCE_A, 10_000),
      row(PURPOSE_B, SOURCE_B, 5_000),
      row(PURPOSE_B, SOURCE_A, 90_000),
      row(PURPOSE_A, SOURCE_B, 20_000),
    ]);

    expect(totals.map((t) => t.id)).toEqual(["p-b", "p-a"]);
    expect(totals[0].byFundingSource.map((s) => s.id)).toEqual(["f-a", "f-b"]);
    expect(totals[1].byFundingSource.map((s) => s.id)).toEqual(["f-b", "f-a"]);
  });

  it("returns nothing for no rows", () => {
    expect(rollUpByPurpose([])).toEqual([]);
  });
});
