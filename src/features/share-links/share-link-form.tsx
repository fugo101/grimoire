import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FieldError } from "@/components/field-error";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ActionError } from "@/i18n/keys";
import { PurposeMultiSelect } from "@/features/share-links/purpose-multi-select";
import { createShareLink, updateShareLink } from "@/server/share-links.actions";
import { shareLinkSchema, type ShareLinkFormValues } from "@/lib/schemas";
import type { Purpose } from "@/lib/db/schema";

interface ShareLinkFormDefaults {
  id: string;
  name: string | null;
  code: string;
  purposeIds: string[];
}

export function ShareLinkForm({
  purposes,
  defaultValues,
  onSuccess,
}: {
  purposes: Purpose[];
  defaultValues?: ShareLinkFormDefaults;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ActionError | null>(null);
  const t = useTranslations();
  const errorMessage = useErrorMessage();

  const initialValues: ShareLinkFormValues = {
    name: defaultValues?.name ?? "",
    code: defaultValues?.code ?? "",
    purposeIds: defaultValues?.purposeIds ?? [],
  };

  const form = useForm({
    defaultValues: initialValues,
    validators: { onSubmit: shareLinkSchema },
    onSubmit: async ({ value }) => {
      const result = defaultValues
        ? await updateShareLink(defaultValues.id, value)
        : await createShareLink(value);

      if (!result.success) {
        setServerError(result.error ?? null);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["shareLinks"] });
      // Editing keeps the values on screen; only the create form clears.
      if (!defaultValues) {
        form.reset({ name: "", code: "", purposeIds: [] });
      }
      onSuccess?.();
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setServerError(null);
        void form.handleSubmit();
      }}
    >
      {/* Same shape as DimensionForm: labelled fields, then a full-width submit
          last. The two management forms sit one tab apart and should not look
          like they came from different applications. */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <form.Field name="name">
          {(field) => (
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={field.name}>{t("shareLinks.form.name")}</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder={t("shareLinks.form.namePlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <form.Field name="code">
          {(field) => (
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={field.name}>{t("shareLinks.form.code")}</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder={t("shareLinks.form.codePlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </div>

      {/*
       * Purposes only. A link's scope is one-dimensional by decision
       * (ADR-0002): its readers see every Funding Source of what is ticked
       * here, which is what keeps the permission model small enough to verify
       * by reading it.
       */}
      <form.Field name="purposeIds">
        {(field) => (
          <div className="space-y-1.5">
            <Label>{t("shareLinks.form.purposes")}</Label>
            <PurposeMultiSelect
              purposes={purposes}
              value={field.state.value}
              onChange={field.handleChange}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(serverError)}
        </p>
      )}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <SubmitButton className="w-full" isLoading={isSubmitting}>
            {defaultValues ? t("common.update") : t("shareLinks.form.create")}
          </SubmitButton>
        )}
      </form.Subscribe>
    </form>
  );
}
