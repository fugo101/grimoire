import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

/**
 * The headline figure, and the reason most people open this link.
 *
 * It replaces a small grey Badge that sat on the same row as the link name with
 * no mobile fallback, so a long name and the total fought over one line. The
 * comparison spells out the direction in words as well as colour and an arrow —
 * relying on red-versus-green alone fails for a colour-blind reader, and on a
 * page written for people who did not choose to be here it is worth being
 * explicit.
 */
export function PublicTotalCard({
  total,
  previousTotal,
  count,
}: {
  total: number;
  previousTotal: number | null;
  count: number;
}) {
  const t = useTranslations("publicReport.total");
  const tCommon = useTranslations("common");
  const tComparison = useTranslations("common.comparison");
  const { formatVND } = useFormatters();
  const delta = previousTotal === null ? null : total - previousTotal;

  const Icon =
    delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  const tone =
    delta === null || delta === 0
      ? "text-muted-foreground"
      : delta > 0
        ? "text-destructive"
        : "text-success";

  let comparison: string | null = null;
  if (previousTotal !== null && delta !== null) {
    if (previousTotal === 0) {
      comparison = t("noneLastMonth");
    } else if (delta === 0) {
      comparison = tComparison("same");
    } else {
      // previousTotal is non-zero here, so the percentage always exists.
      comparison = tComparison("change", {
        direction: delta > 0 ? "more" : "less",
        amount: formatVND(Math.abs(delta)),
        percent: String(Math.abs(Math.round((delta / previousTotal) * 100))),
      });
    }
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4 text-center">
        <p className="text-muted-foreground">{tCommon("totalSpent")}</p>
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          {formatVND(total)}
        </p>
        {comparison && (
          <p className={cn("flex items-center justify-center gap-1.5", tone)}>
            <Icon className="size-5 shrink-0" aria-hidden />
            <span>{comparison}</span>
          </p>
        )}
        <p className="text-muted-foreground">{t("count", { count })}</p>
      </CardContent>
    </Card>
  );
}
