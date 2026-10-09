import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Trash2,
  Pencil,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Share2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useErrorMessage } from "@/hooks/use-error-message";
import { useErrorToast } from "@/hooks/use-error-toast";
import { CopyButton } from "@/components/copy-button";
import { ShareLinkForm } from "@/features/share-links/share-link-form";
import {
  toggleShareLinkEnabled,
  rotateShareLinkCode,
  deleteShareLink,
} from "@/server/share-links.actions";
import { shareLinksQueryOptions } from "@/lib/query-options";
import type { Purpose } from "@/lib/db/schema";
import type { ShareLinkWithPurposes } from "@/lib/db/queries";

export function ShareLinkList({
  links,
  purposes,
}: {
  links: ShareLinkWithPurposes[];
  purposes: Purpose[];
}) {
  const [editing, setEditing] = useState<ShareLinkWithPurposes | null>(null);
  /**
   * Confirmations are hoisted out of the menu. A ConfirmDialog whose trigger is
   * a menu item is unmounted the moment the menu closes, taking the dialog with
   * it — so the menu only records the intent and one controlled dialog renders
   * below. Named `pendingConfirm` rather than `confirm`, which would shadow
   * window.confirm and silently typecheck.
   */
  const [pendingConfirm, setPendingConfirm] = useState<{
    kind: "rotate" | "delete";
    link: ShareLinkWithPurposes;
  } | null>(null);
  const queryClient = useQueryClient();
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const toastError = useErrorToast();
  const linksKey = shareLinksQueryOptions().queryKey;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["shareLinks"] });

  /**
   * Replaces useOptimistic + useTransition. Writing straight into the query
   * cache and rolling back on failure gives the same instant toggle, but keeps
   * the optimistic value and the cached value as one thing instead of two that
   * can disagree.
   */
  const toggle = useMutation({
    mutationFn: (id: string) => toggleShareLinkEnabled(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: linksKey });
      const previous =
        queryClient.getQueryData<ShareLinkWithPurposes[]>(linksKey);
      queryClient.setQueryData<ShareLinkWithPurposes[]>(linksKey, (current) =>
        current?.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
      );
      return { previous };
    },
    onSuccess: (result, _id, ctx) => {
      if (!result.success) {
        if (ctx?.previous) queryClient.setQueryData(linksKey, ctx.previous);
        toastError(errorMessage(result.error));
      }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(linksKey, ctx.previous);
    },
    onSettled: invalidate,
  });

  const rotate = useMutation({
    mutationFn: (id: string) => rotateShareLinkCode(id),
    onSuccess: async (result) => {
      if (!result.success) {
        toastError(errorMessage(result.error));
        return;
      }
      await invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteShareLink(id),
    onSuccess: async (result) => {
      if (!result.success) {
        toastError(errorMessage(result.error));
        return;
      }
      await invalidate();
    },
  });

  if (links.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Share2 />
          </EmptyMedia>
          <EmptyTitle>{t("shareLinks.list.emptyTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("shareLinks.list.emptyDescription")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div key={link.id} className="rounded-lg border p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 font-medium break-words">
                  {link.name || link.code}
                </span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all text-muted-foreground">
                  /p/{link.code}
                </code>
              </div>
              {link.purposeNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {link.purposeNames.map((name, i) => (
                    <Badge
                      key={`${link.id}-${i}`}
                      variant="secondary"
                      className="h-auto max-w-full text-xs break-words whitespace-normal"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/*
             * Two everyday actions stay visible; the rest move behind a menu.
             * Six 32px icon buttons wrapping onto two rows was a row of
             * unlabelled guesses, and the enabled state had no signal at all
             * beyond the switch position — it now says which it is.
             */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <label className="mr-1 flex cursor-pointer items-center gap-2">
                <Switch
                  checked={link.enabled}
                  disabled={toggle.isPending}
                  onCheckedChange={() => toggle.mutate(link.id)}
                />
                <span
                  className={
                    link.enabled ? "text-sm" : "text-sm text-muted-foreground"
                  }
                >
                  {link.enabled
                    ? t("shareLinks.list.enabled")
                    : t("shareLinks.list.disabled")}
                </span>
              </label>

              <CopyButton
                text={`${typeof window !== "undefined" ? window.location.origin : ""}/p/${link.code}`}
              />

              <Button
                variant="ghost"
                size="icon"
                aria-label={t("shareLinks.list.open", {
                  name: link.name || link.code,
                })}
                onClick={() => window.open(`/p/${link.code}`, "_blank")}
              >
                <ExternalLink />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("shareLinks.list.more", {
                        name: link.name || link.code,
                      })}
                    >
                      <MoreHorizontal />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditing(link)}>
                    <Pencil />
                    {t("common.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setPendingConfirm({ kind: "rotate", link })}
                  >
                    <RefreshCw />
                    {t("shareLinks.list.rotate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setPendingConfirm({ kind: "delete", link })}
                  >
                    <Trash2 />
                    {t("common.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}

      {/*
       * Same as the dimension lists: editing opens a modal rather than replacing
       * the row, so the list does not reflow under the reader mid-edit.
       */}
      <ConfirmDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
        title={
          pendingConfirm?.kind === "rotate"
            ? t("shareLinks.list.rotate")
            : t("shareLinks.list.deleteTitle")
        }
        description={
          pendingConfirm?.kind === "rotate"
            ? t("shareLinks.list.rotateConfirm")
            : t("shareLinks.list.deleteConfirm", {
                name:
                  pendingConfirm?.link.name || pendingConfirm?.link.code || "",
              })
        }
        confirmLabel={
          pendingConfirm?.kind === "rotate"
            ? t("shareLinks.list.rotateAction")
            : t("common.delete")
        }
        // Rotating a code is not a deletion and should not be styled like one.
        variant={pendingConfirm?.kind === "rotate" ? "default" : "destructive"}
        onConfirm={async () => {
          if (!pendingConfirm) return;
          if (pendingConfirm.kind === "rotate")
            await rotate.mutateAsync(pendingConfirm.link.id);
          else await remove.mutateAsync(pendingConfirm.link.id);
        }}
      />

      <ResponsiveModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t("shareLinks.list.editTitle")}
      >
        {editing && (
          <ShareLinkForm
            purposes={purposes}
            defaultValues={{
              id: editing.id,
              name: editing.name,
              code: editing.code,
              purposeIds: editing.purposeIds,
            }}
            onSuccess={() => setEditing(null)}
          />
        )}
      </ResponsiveModal>
    </div>
  );
}
