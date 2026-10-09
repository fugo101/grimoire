import { describe, expect, it } from "vitest";
import {
  formatCompactVND,
  formatMonthLabel,
  formatRelativeDay,
  formatVND,
} from "@/lib/format";

/**
 * The locale moved from a hardcoded "vi-VN" to a parameter. For "vi" every
 * output below is the one this file produced before the move, character for
 * character — the change is plumbing, not presentation. The "en" cases are
 * the control that the parameter is actually read: if it were ignored they
 * would come out Vietnamese and fail.
 */
describe("formatVND", () => {
  it("groups with dots and suffixes ₫ in Vietnamese", () => {
    expect(formatVND(1_234_567, "vi")).toBe("1.234.567 ₫");
    expect(formatVND(0, "vi")).toBe("0 ₫");
  });

  it("uses a real minus sign, not a hyphen", () => {
    expect(formatVND(-1_234, "vi")).toBe("−1.234 ₫");
  });

  it("falls back to zero for a non-finite amount", () => {
    expect(formatVND(Number.NaN, "vi")).toBe("0 ₫");
  });

  it("changes only the grouping with the locale, never the currency", () => {
    expect(formatVND(1_234_567, "en")).toBe("1,234,567 ₫");
  });
});

describe("formatCompactVND", () => {
  it("keeps the Vietnamese decimal comma", () => {
    expect(formatCompactVND(1_500_000, "vi")).toBe("1,5M");
    expect(formatCompactVND(250_000, "vi")).toBe("250K");
    expect(formatCompactVND(2_000_000, "vi")).toBe("2M");
    expect(formatCompactVND(999, "vi")).toBe("999");
    expect(formatCompactVND(-1_500, "vi")).toBe("−1,5K");
  });

  it("takes the decimal separator from the locale", () => {
    expect(formatCompactVND(1_500_000, "en")).toBe("1.5M");
  });
});

describe("formatMonthLabel", () => {
  const label = (month: string, year: string) => `Tháng ${month} / ${year}`;

  it("hands the month without its leading zero, and the year untouched", () => {
    expect(formatMonthLabel("2026-07", label)).toBe("Tháng 7 / 2026");
    expect(formatMonthLabel("2026-12", label)).toBe("Tháng 12 / 2026");
  });

  it("returns a malformed key as-is", () => {
    expect(formatMonthLabel("2026", label)).toBe("2026");
  });
});

describe("formatRelativeDay", () => {
  const words = { today: "Hôm nay", yesterday: "Hôm qua" };
  const now = new Date(2026, 6, 15, 9, 0);

  it("names today and yesterday by calendar day, not elapsed hours", () => {
    expect(formatRelativeDay("2026-07-15T00:05", words, now)).toBe("Hôm nay");
    expect(formatRelativeDay("2026-07-14T23:30", words, now)).toBe("Hôm qua");
  });

  it("drops the year only when it is the current one", () => {
    expect(formatRelativeDay("2026-07-01T08:00", words, now)).toBe("01/07");
    expect(formatRelativeDay("2025-07-01T08:00", words, now)).toBe(
      "01/07/2025"
    );
  });

  it("returns an unparseable value as-is", () => {
    expect(formatRelativeDay("not-a-date", words, now)).toBe("not-a-date");
  });
});
