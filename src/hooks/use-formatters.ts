import { useLocale, useTranslations } from "next-intl";
import {
  formatCompactVND,
  formatMonthLabel,
  formatRelativeDay,
  formatVND,
} from "@/lib/format";

/**
 * The `format.ts` functions, bound to the active locale and the catalog's
 * words. The functions themselves stay pure — locale and words are parameters
 * — so tests and server code can call them directly; components call these.
 */
export function useFormatters() {
  const locale = useLocale();
  const t = useTranslations("common.format");

  return {
    formatVND: (amount: number) => formatVND(amount, locale),
    formatCompactVND: (amount: number) => formatCompactVND(amount, locale),
    formatMonthLabel: (month: string) =>
      formatMonthLabel(month, (mon, year) =>
        t("monthLabel", { month: mon, year })
      ),
    formatRelativeDay: (isoString: string, now?: Date) =>
      formatRelativeDay(
        isoString,
        { today: t("today"), yesterday: t("yesterday") },
        now
      ),
  };
}
