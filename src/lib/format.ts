/**
 * Every function here takes the locale as a parameter rather than reading it,
 * so it stays callable from tests and from the server. Components get them
 * pre-bound through `useFormatters()`, which supplies the active locale and the
 * catalog's words.
 *
 * The locale only changes how an amount is *written* — grouping, the decimal
 * separator. Every amount is VND whatever the UI language (see CONTEXT.md), so
 * the ₫ is never the locale's to change.
 */
const groupingCache = new Map<string, Intl.NumberFormat>();
const decimalCache = new Map<string, string>();

function grouping(locale: string): Intl.NumberFormat {
  let format = groupingCache.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    groupingCache.set(locale, format);
  }
  return format;
}

function decimalSeparator(locale: string): string {
  let separator = decimalCache.get(locale);
  if (separator === undefined) {
    separator =
      new Intl.NumberFormat(locale)
        .formatToParts(1.5)
        .find((part) => part.type === "decimal")?.value ?? ".";
    decimalCache.set(locale, separator);
  }
  return separator;
}

/** The current month as `YYYY-MM`, the key every month-scoped view is built on. */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Shift a `YYYY-MM` key by whole months. Negative goes backwards. */
export function addMonths(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Vietnamese grouping for "vi": 1.234.567 ₫, not the 1,234,567 ₫ this shipped
 * with. `toLocaleString("en-US")` was a migration leftover and read as foreign
 * in an otherwise entirely Vietnamese UI.
 *
 * Negative amounts render as −1.234 ₫ with a real minus sign rather than a
 * hyphen, so they line up with digits instead of sitting half a pixel high.
 */
export function formatVND(amount: number, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "0 ₫";
  const sign = value < 0 ? "−" : "";
  return `${sign}${grouping(locale).format(Math.abs(value))} ₫`;
}

/**
 * Axis and chip label: 1,5M / 250K. The decimal separator is the locale's —
 * the Vietnamese comma for "vi" — and everything else is exactly what this
 * produced when the comma was hardcoded.
 */
export function formatCompactVND(amount: number, locale: string): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  const fraction = (val: number) =>
    val % 1 === 0
      ? String(val)
      : val.toFixed(1).replace(".", decimalSeparator(locale));
  if (abs >= 1_000_000) return `${sign}${fraction(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}${fraction(abs / 1_000)}K`;
  return `${sign}${abs}`;
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/**
 * `2026-07` -> `Tháng 7 / 2026`, the heading for every month-scoped view. The
 * words come from the catalog through `label`; this only splits the key, so the
 * month arrives without its leading zero and the year as written — both as
 * strings, so an ICU `{year}` is never grouped into "2.026".
 */
export function formatMonthLabel(
  month: string,
  label: (month: string, year: string) => string
): string {
  const [year, mon] = month.split("-");
  if (!year || !mon) return month;
  return label(String(Number(mon)), year);
}

/**
 * Today / yesterday / `15/07`, for transaction rows where the year is almost
 * always the current one and repeating it is noise. Compares calendar days
 * rather than elapsed hours, so 23:30 yesterday reads as yesterday. The two
 * words come from the catalog through `words`.
 */
export function formatRelativeDay(
  isoString: string,
  words: { today: string; yesterday: string },
  now = new Date()
): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDelta = Math.round(
    (startOfDay(now) - startOfDay(d)) / (24 * 60 * 60 * 1000)
  );

  if (dayDelta === 0) return words.today;
  if (dayDelta === 1) return words.yesterday;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return d.getFullYear() === now.getFullYear()
    ? `${dd}/${mm}`
    : `${dd}/${mm}/${d.getFullYear()}`;
}

/** `08:30`, paired with formatRelativeDay in list rows. */
export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
