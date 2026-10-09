import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Tags, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ResponsiveModal } from "@/components/responsive-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DimensionForm,
  invalidateDimension,
} from "@/features/dimensions/dimension-form";
import type {
  DimensionCopy,
  DimensionSchema,
} from "@/features/dimensions/dimension-copy";
import { useErrorMessage } from "@/hooks/use-error-message";
import { useErrorToast } from "@/hooks/use-error-toast";
import type { ActionState } from "@/lib/types";

export type DimensionEntry = { id: string; name: string };

/**
 * A flat list of one dimension's entries, each renameable and deletable.
 *
 * Flat is the whole change: no tree to build, no chevrons, no collapse state,
 * no indentation budget to spend on a fourth level, and no "this row has N
 * children" warning on delete — a Purpose has no children, and the only reason
 * a delete is ever refused now is that transactions still point at it, which
 * the server answers with a message of its own.
 */
export function DimensionList({
  entries,
  copy,
  schema,
  create,
  update,
  remove,
}: {
  entries: DimensionEntry[];
  copy: DimensionCopy;
  schema: DimensionSchema;
  create: (input: { name: string }) => Promise<ActionState>;
  update: (id: string, input: { name: string }) => Promise<ActionState>;
  remove: (id: string) => Promise<ActionState>;
}) {
  const [editing, setEditing] = useState<DimensionEntry | null>(null);
  const queryClient = useQueryClient();
  const t = useTranslations(copy.namespace);
  const tCommon = useTranslations("common");
  const errorMessage = useErrorMessage();
  const toastError = useErrorToast();

  const deleteEntry = useMutation({
    mutationFn: remove,
    onSuccess: async (result) => {
      if (!result.success) {
        toastError(errorMessage(result.error));
        return;
      }
      await invalidateDimension(queryClient, copy);
    },
    onError: () => {
      // Server Actions throw for a malformed id, for a non-auth error
      // re-thrown by the guard, and for a foreign-key failure. Next redacts
      // the message before it reaches the client, so without this the admin
      // gets "An unexpected response was received from the server." in the
      // middle of a Vietnamese screen.
      toastError(tCommon("deleteFailed"));
    },
  });

  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Tags />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="flex min-h-12 items-center gap-1 rounded-lg border px-1 pl-3">
              <span className="min-w-0 flex-1 truncate font-medium">
                {entry.name}
              </span>

              <Button
                variant="ghost"
                size="icon"
                aria-label={tCommon("editItem", { name: entry.name })}
                onClick={() => setEditing(entry)}
              >
                <Pencil />
              </Button>

              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tCommon("deleteItem", { name: entry.name })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                }
                title={t("deleteTitle")}
                description={t("deleteConfirm", { name: entry.name })}
                onConfirm={() => deleteEntry.mutateAsync(entry.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      {/*
       * Editing opens a modal rather than replacing the row in place. Inline
       * editing swapped a one-line row for a two-row form, so the list jumped
       * and everything below it moved while you were reading it.
       */}
      <ResponsiveModal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t("editTitle")}
      >
        {editing && (
          <DimensionForm
            copy={copy}
            schema={schema}
            create={create}
            update={update}
            defaultValues={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </ResponsiveModal>
    </>
  );
}
