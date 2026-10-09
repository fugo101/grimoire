"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

/**
 * Works two ways.
 *
 * Uncontrolled (pass `trigger`) is the common case: the button that opens it
 * lives inside. Controlled (pass `open` + `onOpenChange`, no trigger) exists for
 * callers whose trigger cannot host the dialog — a dropdown menu item unmounts
 * when the menu closes, taking an inline dialog with it.
 */
export function ConfirmDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "destructive",
  onConfirm,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Not every confirmation is a deletion — rotating a share code is not. */
  variant?: React.ComponentProps<typeof AlertDialogAction>["variant"];
  onConfirm: () => unknown | Promise<unknown>;
}) {
  const t = useTranslations("common");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) setControlledOpen?.(next);
    else setUncontrolledOpen(next);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      // Previously a bare `finally`: a throwing onConfirm left the dialog open
      // with no explanation and no sign anything had gone wrong.
      setError(
        err instanceof Error && err.message ? err.message : t("confirm.failed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      {trigger && <AlertDialogTrigger render={trigger as React.ReactElement} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t("confirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t("confirm.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="px-6 text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel ?? t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Spinner />}
            {confirmLabel ?? t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
