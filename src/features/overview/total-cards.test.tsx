import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TotalCard } from "@/features/overview/summary-cards";
import { PublicTotalCard } from "@/features/public-report/public-total-card";
import { withIntl } from "@/test/intl";

/**
 * The two total cards build their comparison and count lines from ICU
 * messages (`select` on the direction, `plural` on the count) where they used
 * to concatenate strings. The expected texts are the sentences the old
 * concatenation produced, written out literally, so the move is pinned as a
 * no-op for Vietnamese rather than checked against itself.
 */
function lines(node: React.ReactNode): string[] {
  return [
    ...renderToStaticMarkup(withIntl(node)).matchAll(
      /<(?:p|span)\b[^>]*>([^<]+)</g
    ),
  ].map((m) => m[1].trim());
}

describe("TotalCard (overview)", () => {
  it("says how much more than last month, with the percentage", () => {
    expect(
      lines(<TotalCard total={1_500_000} previousTotal={1_000_000} count={3} />)
    ).toEqual(
      expect.arrayContaining([
        "Nhiều hơn tháng trước 500.000 ₫ (50%)",
        "3 khoản chi trong tháng",
      ])
    );
  });

  it("says how much less (control: the other branch of the select)", () => {
    expect(
      lines(<TotalCard total={750_000} previousTotal={1_000_000} count={1} />)
    ).toContain("Ít hơn tháng trước 250.000 ₫ (25%)");
  });

  it("handles an empty or identical previous month, and no transactions", () => {
    expect(lines(<TotalCard total={0} previousTotal={0} count={0} />)).toEqual(
      expect.arrayContaining([
        "Tháng trước chưa có chi tiêu nào",
        "Chưa có khoản chi nào",
      ])
    );
    expect(
      lines(<TotalCard total={5} previousTotal={5} count={1} />)
    ).toContain("Bằng đúng tháng trước");
  });
});

describe("PublicTotalCard", () => {
  it("keeps its own wording, distinct from the dashboard's", () => {
    expect(
      lines(<PublicTotalCard total={2_000} previousTotal={1_000} count={2} />)
    ).toEqual(
      expect.arrayContaining([
        "Tổng chi",
        "Nhiều hơn tháng trước 1.000 ₫ (100%)",
        "2 khoản chi",
      ])
    );
    expect(
      lines(<PublicTotalCard total={0} previousTotal={0} count={0} />)
    ).toEqual(
      expect.arrayContaining([
        "Tháng trước không có khoản chi nào",
        "Không có khoản chi nào",
      ])
    );
  });

  it("shows no comparison when the view is not a single month", () => {
    const shown = lines(
      <PublicTotalCard total={2_000} previousTotal={null} count={2} />
    );
    expect(shown.some((l) => l.includes("tháng trước"))).toBe(false);
    // The control: the rest of the card still renders.
    expect(shown).toContain("2 khoản chi");
  });
});
