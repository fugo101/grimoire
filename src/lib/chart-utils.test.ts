import { describe, expect, it } from "vitest";
import {
  getGroupLabel,
  groupTransactionsByGranularity,
  type GroupLabels,
} from "@/lib/chart-utils";

/**
 * The week and month axis labels are Vietnamese abbreviations ("T5" for tuần
 * 5, "Th.07/26" for tháng 7) — words, so they come from the catalog through
 * `labels`. These are the labels the chart drew when the abbreviations were
 * hardcoded, so the move is pinned as a no-op for Vietnamese.
 */
const VI: GroupLabels = {
  week: (week) => `T${week}`,
  month: (month, year) => `Th.${month}/${year}`,
};

describe("getGroupLabel", () => {
  it("draws the labels the chart has always drawn", () => {
    expect(getGroupLabel("2026-07-15", "day", VI)).toBe("15/07");
    expect(getGroupLabel("2026-W05", "week", VI)).toBe("T5");
    expect(getGroupLabel("2026-07", "month", VI)).toBe("Th.07/26");
    expect(getGroupLabel("2026", "year", VI)).toBe("2026");
  });

  it("takes its words from `labels` (control)", () => {
    const other: GroupLabels = {
      week: (week) => `W${week}`,
      month: (month, year) => `${month}/${year}`,
    };
    expect(getGroupLabel("2026-W05", "week", other)).toBe("W5");
    expect(getGroupLabel("2026-07", "month", other)).toBe("07/26");
  });
});

describe("groupTransactionsByGranularity", () => {
  it("labels every bucket, including the empty ones between", () => {
    const points = groupTransactionsByGranularity(
      [
        { amount: 100, date: "2026-05-02T08:00" },
        { amount: 50, date: "2026-07-20T08:00" },
      ],
      "month",
      VI
    );
    expect(points.map((p) => [p.label, p.total])).toEqual([
      ["Th.05/26", 100],
      ["Th.06/26", 0],
      ["Th.07/26", 50],
    ]);
  });
});
