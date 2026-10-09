import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  type Granularity,
  groupTransactionsByGranularity,
} from "@/lib/chart-utils";
import { useFormatters } from "@/hooks/use-formatters";

const GRANULARITIES: Granularity[] = ["day", "week", "month", "year"];

interface ExpenseChartProps {
  transactions: Array<{ amount: number; date: string }>;
  /**
   * Start collapsed, with the card's own header acting as the toggle.
   *
   * The shared report used to wrap this in a separate collapsible box, which
   * produced two frames and two titles — a "show chart" button and then this
   * card underneath it, visibly not inside it. Worse, Recharts' responsive
   * container measured its parent while that box was still animating from zero
   * height and computed a width wider than the screen, so opening the chart
   * pushed the whole page sideways. Mounting the body only once it is actually
   * visible fixes both.
   */
  collapsible?: boolean;
}

export function ExpenseChart({
  transactions,
  collapsible = false,
}: ExpenseChartProps) {
  const t = useTranslations();
  const { formatCompactVND, formatVND } = useFormatters();
  // Built per render because its label comes from the catalog.
  const chartConfig = {
    total: { label: t("common.totalSpent"), color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [open, setOpen] = useState(!collapsible);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const expanded = !collapsible || open;

  const chartData = useMemo(
    () =>
      groupTransactionsByGranularity(transactions, granularity, {
        week: (week) => t("common.format.week", { week }),
        month: (month, year) =>
          t("common.format.shortMonthYear", { month, year }),
      }),
    [transactions, granularity, t]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {collapsible ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={expanded}
              className="-my-1 flex w-full items-center gap-2 rounded-md py-1 text-left"
            >
              <span className="flex-1">{t("transactions.chart.title")}</span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </button>
          ) : (
            t("transactions.chart.title")
          )}
        </CardTitle>
        <CardAction hidden={!expanded}>
          <Select
            value={granularity}
            onValueChange={(v) => setGranularity(v as Granularity)}
          >
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue>
                {(value: Granularity | null) =>
                  t(`transactions.chart.granularity.${value ?? "day"}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {GRANULARITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`transactions.chart.granularity.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      {expanded && (
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              {t("transactions.chart.empty")}
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-[220px] w-full sm:h-[280px]"
            >
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                {isDesktop && (
                  <YAxis
                    tickFormatter={formatCompactVND}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tick={{ fontSize: 12 }}
                  />
                )}
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatVND(Number(value)),
                        t("common.totalSpent"),
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      )}
    </Card>
  );
}
