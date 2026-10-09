import { useTranslations } from "next-intl";
import { toastError } from "@/lib/toast";

/**
 * An error toast with the catalog's title, and its generic "try again" when
 * the caller has nothing more specific — a Server Action that failed without
 * an `ActionError`, say. Read once at the top of a component, so the returned
 * function can be called from mutation callbacks.
 */
export function useErrorToast(): (message?: string | null) => void {
  const t = useTranslations("common.toast");
  return (message) => toastError(t("errorTitle"), message || t("retry"));
}
