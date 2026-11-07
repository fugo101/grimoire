import { z } from "zod";
import { msg } from "@/i18n/keys";

/*
 * Every message below is a catalog key, not a sentence: these schemas are
 * module-level and shared by TanStack Form, the Server Actions and the Route
 * Handlers, none of which has a translator in scope here. The form translates
 * the key where it displays it (`<FieldError>`). ADR-0004 has the alternatives
 * and why they lost. A constraint a user can trip must carry a key — without
 * one Zod's English default reaches `<FieldError>`, which can only fall back
 * to a generic message.
 */

/**
 * A `YYYY-MM` month key.
 *
 * Every month filter compares ISO date strings by prefix, so the *shape* of
 * this value is load-bearing rather than cosmetic. `nextMonthStart` parses it
 * with `Number`, and a non-numeric month yields the string "NaN-NaN-01" — which
 * sorts above every real ISO date, silently dropping the upper bound of the
 * range instead of erroring. A malformed lower bound is just as quiet: it
 * matches nothing and the page renders as empty.
 *
 * Rejecting the value at the boundary is what keeps those two failures from
 * looking like real answers.
 */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, msg("validation.monthFormat"));

/**
 * The `fromMonth` / `toMonth` pair, as a route reads it out of the URL.
 *
 * Lenient: a malformed month falls back to "no bound" instead of throwing into
 * the error component. URLs get hand-edited, truncated by chat clients, and
 * shared long after the UI that produced them changed — answering a mangled
 * `?toMonth=` with a full-page error is worse than answering with an unfiltered
 * report, and `/p/[code]` is read by people who cannot fix the link themselves.
 *
 * The Route Handlers read their URLs through the same parsers, so a refetch
 * filters exactly as the page's first render did.
 *
 * This is not a hole: `.catch` produces `undefined`, never the malformed
 * string, so nothing invalid reaches the query layer.
 */
export const monthRangeSearchSchema = z.object({
  fromMonth: monthSchema.optional().catch(undefined),
  toMonth: monthSchema.optional().catch(undefined),
});

/**
 * Both dimensions are required on every transaction. There is no "unassigned"
 * state and no default: a payment always came from somewhere and went towards
 * something, and letting either be blank would put rows in the one place a
 * roll-up cannot account for them.
 */
export const transactionSchema = z.object({
  amount: z.number().positive(msg("validation.amountPositive")),
  note: z.string().max(500, msg("validation.noteTooLong")),
  date: z.string().min(1, msg("validation.dateRequired")),
  purposeId: z.string().min(1, msg("dimensions.purpose.required")),
  fundingSourceId: z.string().min(1, msg("dimensions.fundingSource.required")),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

/**
 * The two dimensions carry the same shape — a name, and nothing else. They get
 * their own schemas anyway, rather than one shared `dimensionSchema`, because
 * the validation message is the whole user-facing difference between them and
 * a single schema would have to pick one word or say neither. The length limit
 * is the same for both, so its message is the shared `validation.nameTooLong`.
 */
export const purposeSchema = z.object({
  // Trimmed before the length check, so three spaces is an empty name rather
  // than a valid one that renders as a blank row in every list and an
  // unlabelled option in every picker.
  name: z
    .string()
    .trim()
    .min(1, msg("dimensions.purpose.nameRequired"))
    .max(100, msg("validation.nameTooLong")),
});

export const fundingSourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, msg("dimensions.fundingSource.nameRequired"))
    .max(100, msg("validation.nameTooLong")),
});

/**
 * TanStack Form matches a Standard Schema against its form data invariantly, so
 * a form's values must be typed as the schema's *input* rather than its output.
 * These differ wherever a field is optional.
 */
export type PurposeFormValues = z.input<typeof purposeSchema>;
export type FundingSourceFormValues = z.input<typeof fundingSourceSchema>;

/**
 * A share-link code, as accepted on write.
 *
 * The floor is 8 rather than 3 because this code *is* the credential: anyone
 * holding it reads the report. A 3-character code is a ~250k keyspace, and
 * nothing here rate-limits guesses. Auto-generated codes are nanoid(12) over 36
 * characters, so only hand-picked ones were ever short.
 *
 * Read paths deliberately do not apply this floor — see SHARE_CODE_SHAPE — so
 * links shared before the floor existed keep working.
 */
export const SHARE_CODE_PATTERN = /^[a-zA-Z0-9-]{8,32}$/;

/**
 * The same alphabet with no length floor, for validating a code on the way in
 * from a URL. Its job is to reject shapes that could never be a code at all,
 * not to re-litigate the length of codes already handed out.
 */
export const SHARE_CODE_SHAPE = /^[a-zA-Z0-9-]{1,32}$/;

export const shareLinkSchema = z.object({
  name: z.string().max(100, msg("validation.nameTooLong")).optional(),
  code: z
    .string()
    .regex(SHARE_CODE_PATTERN, msg("validation.shareCodeFormat"))
    .optional()
    .or(z.literal("")),
  // Purposes only — a link's scope is one-dimensional by decision (ADR-0002).
  purposeIds: z
    .array(z.string())
    .min(1, msg("validation.shareLinkPurposesRequired")),
});

export type ShareLinkFormValues = z.input<typeof shareLinkSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, msg("validation.usernameRequired")),
  password: z.string().min(1, msg("validation.passwordRequired")),
});

export type LoginInput = z.infer<typeof loginSchema>;
