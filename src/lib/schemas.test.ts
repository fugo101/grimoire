import { describe, expect, it } from "vitest";
import type { z } from "zod";
import messages from "../../messages/vi.json";
import {
  fundingSourceSchema,
  loginSchema,
  monthSchema,
  purposeSchema,
  shareLinkSchema,
  transactionSchema,
} from "@/lib/schemas";

/** The catalog's text for a dotted key, or undefined when there is none. */
function lookup(key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      messages
    );
  return typeof value === "string" ? value : undefined;
}

function issueMessages(schema: z.ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.message);
}

const tooLong = (n: number) => "x".repeat(n + 1);

/**
 * Every message a form can show comes out of these schemas, and `<FieldError>`
 * translates it as a key. A message that is not a key — Zod's own English
 * default from a constraint someone forgot to label — would fall back to the
 * generic `validation.invalid`, which is better than raw English but still a
 * worse message than the one the constraint deserved. So every rejection a
 * user can trigger is enumerated here and must land on a real catalog entry.
 */
const rejections: [string, z.ZodType, unknown, string][] = [
  ["a malformed month", monthSchema, "2026-13", "validation.monthFormat"],
  [
    "a zero amount",
    transactionSchema,
    {
      amount: 0,
      note: "",
      date: "2026-07-01T08:00",
      purposeId: "p",
      fundingSourceId: "f",
    },
    "validation.amountPositive",
  ],
  [
    "an over-long note",
    transactionSchema,
    {
      amount: 1,
      note: tooLong(500),
      date: "2026-07-01T08:00",
      purposeId: "p",
      fundingSourceId: "f",
    },
    "validation.noteTooLong",
  ],
  [
    "no time",
    transactionSchema,
    { amount: 1, note: "", date: "", purposeId: "p", fundingSourceId: "f" },
    "validation.dateRequired",
  ],
  [
    "no Purpose",
    transactionSchema,
    {
      amount: 1,
      note: "",
      date: "2026-07-01T08:00",
      purposeId: "",
      fundingSourceId: "f",
    },
    "dimensions.purpose.required",
  ],
  [
    "no Funding Source",
    transactionSchema,
    {
      amount: 1,
      note: "",
      date: "2026-07-01T08:00",
      purposeId: "p",
      fundingSourceId: "",
    },
    "dimensions.fundingSource.required",
  ],
  [
    "a blank Purpose name",
    purposeSchema,
    { name: "   " },
    "dimensions.purpose.nameRequired",
  ],
  [
    "an over-long Purpose name",
    purposeSchema,
    { name: tooLong(100) },
    "validation.nameTooLong",
  ],
  [
    "a blank Funding Source name",
    fundingSourceSchema,
    { name: "   " },
    "dimensions.fundingSource.nameRequired",
  ],
  [
    "an over-long Funding Source name",
    fundingSourceSchema,
    { name: tooLong(100) },
    "validation.nameTooLong",
  ],
  [
    "an over-long link name",
    shareLinkSchema,
    { name: tooLong(100), code: "", purposeIds: ["p"] },
    "validation.nameTooLong",
  ],
  [
    "a short link code",
    shareLinkSchema,
    { name: "", code: "abc", purposeIds: ["p"] },
    "validation.shareCodeFormat",
  ],
  [
    "a link with no Purposes",
    shareLinkSchema,
    { name: "", code: "", purposeIds: [] },
    "validation.shareLinkPurposesRequired",
  ],
  [
    "no username",
    loginSchema,
    { username: "", password: "x" },
    "validation.usernameRequired",
  ],
  [
    "no password",
    loginSchema,
    { username: "x", password: "" },
    "validation.passwordRequired",
  ],
];

describe("schema messages are catalog keys", () => {
  it.each(rejections)("labels %s", (_, schema, input, key) => {
    expect(issueMessages(schema, input)).toEqual([key]);
    expect(lookup(key)).toEqual(expect.any(String));
  });

  it("accepts each fixture once the one bad field is fixed (control)", () => {
    // Without this a fixture broken in a second field would still produce the
    // expected key alongside others and could hide behind it; toEqual([key])
    // above already pins the count, and this pins that valid input passes.
    expect(
      transactionSchema.safeParse({
        amount: 1,
        note: "",
        date: "2026-07-01T08:00",
        purposeId: "p",
        fundingSourceId: "f",
      }).success
    ).toBe(true);
    expect(purposeSchema.safeParse({ name: "x" }).success).toBe(true);
    expect(
      shareLinkSchema.safeParse({ name: "", code: "", purposeIds: ["p"] })
        .success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ username: "x", password: "x" }).success
    ).toBe(true);
  });

  it("states the limit the schema actually enforces", () => {
    // The number lives twice — in the constraint and in the sentence — so a
    // change to one without the other is caught here rather than on screen.
    expect(purposeSchema.safeParse({ name: "x".repeat(100) }).success).toBe(
      true
    );
    expect(lookup("validation.nameTooLong")).toContain("100");
    expect(
      transactionSchema.safeParse({
        amount: 1,
        note: "x".repeat(500),
        date: "2026-07-01T08:00",
        purposeId: "p",
        fundingSourceId: "f",
      }).success
    ).toBe(true);
    expect(lookup("validation.noteTooLong")).toContain("500");
  });
});
