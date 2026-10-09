import { useMessages, useTranslations } from "next-intl";
import { isMessageKey, type DynamicTranslator } from "@/i18n/keys";

/**
 * A form field's first validation error, in words.
 *
 * The schemas carry catalog keys, not sentences (ADR-0004), so this is where a
 * key becomes text. Anything that is not a known key — Zod's English default
 * for a constraint that was never labelled — reads as the generic
 * `validation.invalid` rather than reaching the screen as-is: a vague
 * Vietnamese sentence beats a precise English one in the middle of a form.
 */
export function FieldError({
  errors,
}: {
  errors: ReadonlyArray<{ message: string } | undefined>;
}) {
  const t = useTranslations() as DynamicTranslator;
  const messages = useMessages();
  const message = errors[0]?.message;
  if (message === undefined) return null;

  const key = isMessageKey(messages, message) ? message : "validation.invalid";

  return <p className="text-sm text-destructive">{t(key)}</p>;
}
