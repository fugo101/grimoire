import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FieldError } from "@/components/field-error";
import { messages, withIntl } from "@/test/intl";

function text(errors: Parameters<typeof FieldError>[0]["errors"]): string {
  return renderToStaticMarkup(withIntl(<FieldError errors={errors} />))
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Schemas carry catalog keys (ADR-0004), so this is the one place a form
 * error turns into words. A key must never reach the screen raw, and neither
 * must a message that is not a key — Zod's English default for a constraint
 * nobody labelled.
 */
describe("FieldError", () => {
  it("translates a key into the catalog's sentence", () => {
    expect(text([{ message: "validation.amountPositive" }])).toBe(
      messages.validation.amountPositive
    );
  });

  it("translates a key from a dimension's own subtree", () => {
    expect(text([{ message: "dimensions.fundingSource.required" }])).toBe(
      messages.dimensions.fundingSource.required
    );
  });

  it("falls back to the generic message for anything that is not a key", () => {
    expect(
      text([{ message: "Too big: expected string to have <=100 characters" }])
    ).toBe(messages.validation.invalid);
    // A namespace is a real path in the catalog but not a message.
    expect(text([{ message: "validation" }])).toBe(messages.validation.invalid);
  });

  it("shows only the first error", () => {
    expect(
      text([
        { message: "validation.dateRequired" },
        { message: "validation.amountPositive" },
      ])
    ).toBe(messages.validation.dateRequired);
  });

  it("renders nothing without an error (control)", () => {
    expect(renderToStaticMarkup(withIntl(<FieldError errors={[]} />))).toBe("");
    expect(
      renderToStaticMarkup(withIntl(<FieldError errors={[undefined]} />))
    ).toBe("");
  });
});
