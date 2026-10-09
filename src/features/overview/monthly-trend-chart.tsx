import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Change over time, one series — so a plain bar chart with no legend. The title
 * names the series, which is what a legend box would have said.
 *
 * The selected month is drawn in the same hue as the rest rather than
 * highlighted in a second colour: the axis label already says which month it
 * is, and a second hue here would imply a second category.
 */
export function MonthlyTrendChart({
  series,
}: {
  series: { month: string; total: number }[];
}) {
  const t = useTranslations("common");
  const tOverview = useTranslations("overview");
  const { formatCompactVND, formatMonthLabel, formatVND } = useFormatters();
  // Built per render because its label comes from the catalog.
  const chartConfig = {
    total: { label: t("totalSpent"), color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const data = series.map((point) => {
    const [year, mon] = point.month.split("-");
    return {
      label: t("format.shortMonthYear", {
        month: String(Number(mon)),
        year: year.slice(2),
      }),
      full: formatMonthLabel(point.month),
      total: point.total,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tOverview("trend.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            {/* Recessive grid: horizontal only, so it reads as a reference
                rather than as graph paper. */}
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
                  labelKey="full"
                  formatter={(value) => [
                    formatVND(Number(value)),
                    t("totalSpent"),
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
      </CardContent>
    </Card>
  );
}
