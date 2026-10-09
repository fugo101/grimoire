import { useTranslations } from "next-intl";
import type { ActionError, DynamicTranslator } from "@/i18n/keys";

/**
 * Turns a Server Action's `ActionError` into the sentence to show. Actions
 * return keys, not prose (ADR-0004); this is the one place they become words,
 * shared by the forms' inline errors and the lists' toasts.
 */
export function useErrorMessage(): (
  error: ActionError | null | undefined
) => string | undefined {
  const t = useTranslations() as DynamicTranslator;
  return (error) => (error ? t(error.key, error.values) : undefined);
}
