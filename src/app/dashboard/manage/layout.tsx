import { useTranslations } from "next-intl";
import { NavLink } from "@/components/nav-link";
import {
  FUNDING_SOURCE_COPY,
  PURPOSE_COPY,
} from "@/features/dimensions/dimension-copy";

/**
 * Each tab's label is a catalog key. The two dimension tabs reuse the
 * dimension's own `plural`, so a tab can never name a dimension differently
 * from the screen it opens.
 */
const TABS = [
  {
    href: "/dashboard/manage/purposes",
    label: `${PURPOSE_COPY.namespace}.plural`,
  },
  {
    href: "/dashboard/manage/funding-sources",
    label: `${FUNDING_SOURCE_COPY.namespace}.plural`,
  },
  { href: "/dashboard/manage/links", label: "dashboard.manage.links" },
] as const;

/**
 * The two dimensions and the share links are all "set it up once" screens, so
 * they share a tab rather than each taking a slot in the bottom bar next to
 * the two screens used daily.
 *
 * Three tabs now rather than two, and the Vietnamese for these dimensions is
 * longer than the word it replaces — "Link công khai" is shortened to "Link"
 * to buy the room back. The tabs are `flex-auto`, not `flex-1`: three equal
 * thirds of a 360px phone leave ~82px of text room each, and "Mục đích chi"
 * needs ~85px, so it wrapped onto two lines inside its pill (seen at 360px
 * under #138). Growing from content width instead, the long tab takes what
 * it needs and "Link" gives it up — all three fit one line at 360px.
 *
 * Built from plain nav links rather than the Tabs component on purpose.
 * Tabs is a tab-*panel* widget: it owns the selected value and pairs each
 * `role="tab"` with a `tabpanel` in the same document. These switch routes,
 * so the URL is the selected value and there is no panel — `<nav>` with
 * `aria-current="page"` is the honest markup, and it keeps the targets at
 * 44px instead of Tabs' 32px.
 *
 * No data to prefetch here, so unlike the pages below this is a plain
 * server component with no HydrationBoundary — it just composes markup
 * around `{children}`, interleaving `NavLink` (a client leaf) the way any
 * Server Component may.
 */
export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("dashboard.manage.title")}
      </h1>

      <nav aria-label={t("dashboard.manage.nav")}>
        <ul className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <li key={tab.href} className="flex-auto">
              <NavLink
                href={tab.href}
                className="flex h-11 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors md:h-9"
                activeClassName="bg-background text-foreground shadow-xs"
              >
                {t(tab.label)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {children}
    </div>
  );
}
