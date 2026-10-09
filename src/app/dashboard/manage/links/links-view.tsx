"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareLinkForm } from "@/features/share-links/share-link-form";
import { ShareLinkList } from "@/features/share-links/share-link-list";
import {
  purposesQueryOptions,
  shareLinksQueryOptions,
} from "@/lib/query-options";

export function LinksView() {
  const t = useTranslations("shareLinks");
  const { data: purposes } = useSuspenseQuery(purposesQueryOptions());
  const { data: links } = useSuspenseQuery(shareLinksQueryOptions());

  return (
    // Deliberately the same shape as the two dimension tabs: boxed create form
    // on top, titled list below, and no <h1> — the layout above already
    // owns it.
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ShareLinkForm purposes={purposes} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-semibold tracking-tight">
          {t("allLinks")}
          {links.length > 0 && (
            <span className="ml-2 font-normal text-muted-foreground tabular-nums">
              {links.length}
            </span>
          )}
        </h2>
        <ShareLinkList links={links} purposes={purposes} />
      </section>
    </div>
  );
}
