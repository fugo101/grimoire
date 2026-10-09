import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/vi.json";
import { DEFAULT_LOCALE } from "@/i18n/config";

/**
 * Renders under the real Vietnamese catalog, the way the root layout's
 * provider does in the app. A component test asserts on what a reader sees,
 * so it reads the words from the catalog rather than restating them — a test
 * that hardcoded its own copy would keep passing after the catalog changed.
 */
export function withIntl(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

export { messages };
