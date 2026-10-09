"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { FieldError } from "@/components/field-error";
import { ThemeToggle } from "@/components/theme-toggle";
import { useThemePreference } from "@/app/theme-context";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { ActionError } from "@/i18n/keys";
import { loginSchema } from "@/lib/schemas";
import { login } from "@/server/auth.actions";

export function LoginForm() {
  const t = useTranslations("login");
  const themePreference = useThemePreference();
  const router = useRouter();
  const [serverError, setServerError] = useState<ActionError | null>(null);
  const errorMessage = useErrorMessage();

  const form = useForm({
    defaultValues: { username: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      const result = await login(value);
      if (!result.success) {
        setServerError(result.error ?? null);
        return;
      }
      // The Set-Cookie from the action above is already in the jar by the
      // time this runs. `refresh()` (not just `push`) is what makes sure
      // `dashboard/layout.tsx`'s `readSession()` sees it rather than a
      // Router-cached RSC payload from before sign-in — same reasoning as
      // the sign-out flow in `dashboard-shell.tsx`.
      router.push("/dashboard");
      router.refresh();
    },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Same reason as /p/[code]: the dashboard header is unreachable here,
          so without this there is no way to change theme while signed out. */}
      <div className="absolute top-4 right-4">
        <ThemeToggle themePreference={themePreference} />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Grimoire</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setServerError(null);
              void form.handleSubmit();
            }}
          >
            <form.Field name="username">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t("username")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="username"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t("password")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            {serverError && (
              <p className="text-sm text-destructive">
                {errorMessage(serverError)}
              </p>
            )}

            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <SubmitButton className="w-full" isLoading={isSubmitting}>
                  {t("submit")}
                </SubmitButton>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
