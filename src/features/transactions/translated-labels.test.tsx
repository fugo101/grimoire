import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExpenseChart } from "@/features/transactions/expense-chart";
import { transactionColumns } from "@/features/transactions/columns";
import { MonthRangePicker } from "@/components/ui/monthrangepicker";
import { messages, withIntl } from "@/test/intl";

const text = (html: string) => html.replace(/<[^>]+>/g, "\n");

/**
 * Labels that are resolved somewhere other than the obvious JSX, so a static
 * check cannot see them go wrong: a Base UI `Select` trigger takes its label
 * from the `SelectValue` children function (CLAUDE.md's own example of a
 * select that once showed a sentinel and then a raw id), table headers are
 * rendered by `flexRender`, and the picker builds its month cells and presets
 * from data. Each is rendered and read back as a reader would see it.
 */
describe("ExpenseChart", () => {
  it("names the selected granularity in the select trigger, not its value", () => {
    const html = renderToStaticMarkup(
      withIntl(
        <ExpenseChart
          transactions={[{ amount: 1000, date: "2026-07-01T08:00" }]}
        />
      )
    );
    // The default granularity is "week".
    expect(text(html)).toContain(messages.transactions.chart.granularity.week);
    // The control: the raw value and the catalog key never reach the screen.
    expect(text(html)).not.toMatch(/\bweek\b/);
    expect(html).not.toContain("transactions.chart");
    expect(text(html)).toContain(messages.transactions.chart.title);
  });
});

describe("transactionColumns", () => {
  it("renders every header from the catalog", () => {
    const headers = transactionColumns()
      .map((column) => column.header)
      .filter((header) => typeof header === "function")
      .map((Header) => {
        const Component = Header as () => React.ReactNode;
        return renderToStaticMarkup(withIntl(<Component />));
      });
    expect(headers).toEqual(Object.values(messages.transactions.columns));
  });
});

describe("row actions", () => {
  it("name the row they act on, for a screen reader", () => {
    const actions = transactionColumns({
      onEdit: () => {},
      onDelete: () => {},
    }).find((column) => column.id === "actions");
    const Cell = actions?.cell as (props: {
      row: { original: { id: string; note: string } };
    }) => React.ReactNode;
    const html = renderToStaticMarkup(
      withIntl(<Cell row={{ original: { id: "t1", note: "Cà phê" } }} />)
    );
    expect(html).toContain('aria-label="Sửa Cà phê"');
    expect(html).toContain('aria-label="Xoá Cà phê"');
    // The control: without a note the row is named generically, not blank.
    const unnamed = renderToStaticMarkup(
      withIntl(<Cell row={{ original: { id: "t2", note: "" } }} />)
    );
    expect(unnamed).toContain(
      `aria-label="Sửa ${messages.transactions.unnamed}"`
    );
  });
});

describe("MonthRangePicker", () => {
  it("labels months and presets in words, not numbers or keys", () => {
    const shown = text(
      renderToStaticMarkup(
        withIntl(<MonthRangePicker onMonthRangeSelect={() => {}} />)
      )
    );
    // Matched as whole cells, so "Th.1" cannot pass on the strength of "Th.10".
    const cells = shown.split("\n").map((s) => s.trim());
    for (const month of ["Th.1", "Th.7", "Th.12"]) {
      expect(cells).toContain(month);
    }
    for (const preset of Object.values(messages.common.monthRange)) {
      expect(shown).toContain(preset);
    }
    expect(shown).not.toContain("common.");
  });
});
