import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Shown while a route loader is in flight. Rendered by each of the App
 * Router's `loading.tsx` files (`dashboard/`, `dashboard/transactions/`,
 * `dashboard/manage/purposes/`, `dashboard/manage/funding-sources/`, `dashboard/manage/links/`) so the fallback
 * markup lives in exactly one place.
 */
export function PendingIndicator() {
  const t = useTranslations("common");
  return (
    <div className="flex w-full items-center justify-center py-24">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("loadingData")}</p>
      </div>
    </div>
  );
}
