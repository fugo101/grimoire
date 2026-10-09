import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useErrorMessage } from "@/hooks/use-error-message";
import { actionError, type ActionError } from "@/i18n/keys";
import { messages, withIntl } from "@/test/intl";

function Shown({ error }: { error: ActionError | undefined }) {
  const errorMessage = useErrorMessage();
  return <p>{errorMessage(error)}</p>;
}

function text(error: ActionError | undefined): string {
  return renderToStaticMarkup(withIntl(<Shown error={error} />))
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * The one place a Server Action's error becomes words, and the only display
 * path that interpolates values — `<FieldError>`'s schema messages take none.
 */
describe("useErrorMessage", () => {
  it("interpolates the values the action sent", () => {
    const shown = text(
      actionError("errors.auth.tooManyAttempts", { minutes: 5 })
    );
    expect(shown).toContain("5 phút");
    // The control: the placeholder itself never reaches the screen.
    expect(shown).not.toContain("{minutes");
  });

  it("renders an argument-free message as the catalog has it", () => {
    expect(text(actionError("errors.auth.invalidCredentials"))).toBe(
      messages.errors.auth.invalidCredentials
    );
  });

  it("keeps each dimension's own words", () => {
    expect(text(actionError("dimensions.fundingSource.errors.inUse"))).toBe(
      messages.dimensions.fundingSource.errors.inUse
    );
    expect(text(actionError("dimensions.purpose.errors.inUse"))).toBe(
      messages.dimensions.purpose.errors.inUse
    );
  });

  it("renders nothing when there is no error", () => {
    expect(text(undefined)).toBe("");
  });
});
