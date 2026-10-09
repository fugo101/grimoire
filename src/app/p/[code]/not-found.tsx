import { useTranslations } from "next-intl";
import { PublicShell } from "./public-shell";

/**
 * Segment-scoped, not the generic `app/not-found.tsx` — the copy here is
 * `/p`-specific, and the generic one's home link points at
 * `/dashboard`, which means nothing to someone who only ever had this URL.
 *
 * Reached both when the code fails `SHARE_CODE_SHAPE` (a mistyped or
 * truncated link) and when `getPublicReport` resolves to `null` (a
 * well-formed but disabled or nonexistent code) — both cases get this same
 * screen rather than a full-page error, since neither is something the
 * reader can fix by retrying.
 */
export default function LinkNotFound() {
  const t = useTranslations("publicReport.notFound");
  return (
    <PublicShell>
      <div className="space-y-3 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
    </PublicShell>
  );
}
