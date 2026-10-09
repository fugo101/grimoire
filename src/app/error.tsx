"use client";

import { useTranslations } from "next-intl";
import { CenteredMessage } from "@/components/centered-message";

/**
 * Segment error boundary — must be a Client Component. Covers everything
 * under the root layout except the layout itself (see global-error.tsx for
 * that case). Replaces `__root.tsx`'s `RootError`.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
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
