import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { addMonths, getCurrentMonth } from "@/lib/format";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Month navigation as two big arrows around a label, rather than a range
 * popover. Stepping one month at a time is what people actually do, and it is
 * reachable with a thumb and no reading — which the popover, with its two-year
 * grid and quick-select column, is not.
 *
 * Stepping past the current month is blocked: there is nothing there, and an
 * empty screen reads as a bug rather than as "the future has no spending yet".
 */
export function MonthStepper({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const t = useTranslations("common");
  const { formatMonthLabel } = useFormatters();
  const atCurrent = month >= getCurrentMonth();

  return (
    <ButtonGroup className="w-full">
      <Button
        variant="outline"
        size="lg"
        className="shrink-0"
        aria-label={t("previousMonth")}
        onClick={() => onChange(addMonths(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <div
        aria-live="polite"
        className="flex flex-1 items-center justify-center border border-input bg-background px-2 text-center text-base font-semibold"
      >
        {formatMonthLabel(month)}
      </div>
      <Button
        variant="outline"
        size="lg"
        className="shrink-0"
        aria-label={t("nextMonth")}
        disabled={atCurrent}
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight />
      </Button>
    </ButtonGroup>
  );
}
