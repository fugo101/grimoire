import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Shared by app/not-found.tsx, app/error.tsx and app/global-error.tsx — the
 * three whole-page fallbacks that replace what `__root.tsx`'s `RootError`/
 * `RootNotFound` covered under TanStack Router. No directive, and the one hook
 * is `useTranslations`, which works on both sides: a Server Component
 * (not-found.tsx) and Client Components (error.tsx, global-error.tsx) can
 * all render it directly. global-error.tsx supplies its own provider, since it
 * replaces the layout that normally does.
 */
export function CenteredMessage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("app");
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{children}</p>
      <Link href="/dashboard" className="text-sm underline">
        {t("home")}
      </Link>
    </div>
  );
}
