"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import messages from "../../messages/vi.json";
import { CenteredMessage } from "@/components/centered-message";
import { DEFAULT_LOCALE } from "@/i18n/config";

/**
 * Only triggers if the root layout itself throws (e.g. the `cookies()` read
 * in layout.tsx). Next requires it to render its own <html>/<body>, since it
 * replaces the layout that would normally provide them. No Providers, no
 * Tailwind theme class — the layout that would have supplied both is exactly
 * what failed, so this stays deliberately minimal.
 *
 * That includes the layout's `NextIntlClientProvider`, so this brings its own,
 * with the default locale's catalog imported directly: with the layout gone
 * there is no request config to ask, and an error page that could not find
 * its own words would be no error page at all. This is the one place besides
 * `src/i18n/request.ts` that picks a locale, and it can only pick the default;
 * when a second language exists, this file has to learn to choose too. Only
 * the `app` subtree is handed over — it is all this page and
 * `CenteredMessage` read.
 */
export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>
        <NextIntlClientProvider
          locale={DEFAULT_LOCALE}
          messages={{ app: messages.app }}
        >
          <GlobalErrorMessage reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function GlobalErrorMessage({ reset }: { reset: () => void }) {
  const t = useTranslations("app.error");
  return (
    <CenteredMessage title={t("title")}>
      <span className="block">{t("description")}</span>
      <button type="button" onClick={reset} className="mt-2 text-sm underline">
        {t("retry")}
      </button>
    </CenteredMessage>
  );
}
