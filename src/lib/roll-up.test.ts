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

const FOOD: [string, string] = ["p-food", "Purpose A"];
const RENT: [string, string] = ["p-rent", "Purpose B"];
const WALLET: [string, string] = ["f-wallet", "Source A"];
const GIFT: [string, string] = ["f-gift", "Source B"];

describe("rollUpByPurpose", () => {
  it("gives each Purpose its Gross cost and a Funding split that adds back up to it", () => {
    const totals = rollUpByPurpose([
      row(FOOD, WALLET, 100_000),
      row(FOOD, GIFT, 30_000),
      row(FOOD, WALLET, 20_000),
    ]);

    expect(totals).toEqual([
      {
        id: "p-food",
        name: "Purpose A",
        total: 150_000,
        byFundingSource: [
          { id: "f-wallet", name: "Source A", total: 120_000 },
          { id: "f-gift", name: "Source B", total: 30_000 },
        ],
      },
    ]);
  });

  it("keeps two Purposes apart when they share a name, because a Purpose is its id", () => {
    const twin: [string, string] = ["p-twin", FOOD[1]];

    const totals = rollUpByPurpose([
      row(FOOD, WALLET, 100_000),
      row(twin, WALLET, 40_000),
    ]);

    expect(totals.map((t) => [t.id, t.total])).toEqual([
      ["p-food", 100_000],
      ["p-twin", 40_000],
    ]);
  });

  it("orders Purposes, and each Funding split, by largest first", () => {
    const totals = rollUpByPurpose([
      row(FOOD, WALLET, 10_000),
      row(RENT, GIFT, 5_000),
      row(RENT, WALLET, 90_000),
      row(FOOD, GIFT, 20_000),
    ]);

    expect(totals.map((t) => t.id)).toEqual(["p-rent", "p-food"]);
    expect(totals[0].byFundingSource.map((s) => s.id)).toEqual([
      "f-wallet",
      "f-gift",
    ]);
    expect(totals[1].byFundingSource.map((s) => s.id)).toEqual([
      "f-gift",
      "f-wallet",
    ]);
  });

  it("returns nothing for no rows", () => {
    expect(rollUpByPurpose([])).toEqual([]);
  });
});
