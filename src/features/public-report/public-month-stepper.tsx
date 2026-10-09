import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { addMonths, getCurrentMonth } from "@/lib/format";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Month navigation for the shared report.
 *
 * Larger and plainer than the dashboard's stepper, and it says "Tháng trước" /
 * "Tháng sau" in words rather than relying on the arrows alone. The reader here
 * did not choose this app and may never have used it before; an unlabelled
 * chevron is a guess, not an affordance.
 *
 * This replaces a popover holding a two-year grid and an English quick-select
 * column — a control that assumed someone wanted to think about date ranges.
 */
export function PublicMonthStepper({
  month,
  onChange,
}: {
  month: string | null;
  onChange: (month: string | null) => void;
}) {
  const t = useTranslations();
  const { formatMonthLabel } = useFormatters();
  const current = getCurrentMonth();
  const active = month ?? current;
  const atCurrent = active >= current;

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2">
        <Button
          variant="outline"
          className="h-14 flex-1 flex-col gap-0 px-2"
          onClick={() => onChange(addMonths(active, -1))}
        >
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="size-4" />
            {t("common.previousMonth")}
          </span>
        </Button>

        <div
          aria-live="polite"
          className="flex h-14 flex-[1.4] items-center justify-center rounded-lg border border-input bg-muted/40 px-2 text-center font-semibold"
        >
          {month ? formatMonthLabel(month) : t("common.allTime")}
        </div>

        <Button
          variant="outline"
          className="h-14 flex-1 flex-col gap-0 px-2"
          disabled={atCurrent && month !== null}
          onClick={() => onChange(addMonths(active, 1))}
        >
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {t("common.nextMonth")}
            <ChevronRight className="size-4" />
          </span>
        </Button>
      </div>

      <div className="text-center">
        {month ? (
          <Button variant="link" onClick={() => onChange(null)}>
            {t("publicReport.showAllTime")}
          </Button>
        ) : (
          <Button variant="link" onClick={() => onChange(current)}>
            {t("publicReport.onlyThisMonth")}
          </Button>
        )}
      </div>
    </div>
  );
}
