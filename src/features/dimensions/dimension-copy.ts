import type { Messages, NestedKeyOf } from "next-intl";
import type { z } from "zod";

/**
 * Everything that differs between the two dimensions, in one place.
 *
 * The management screens, the form, the filters and the list are shared
 * components — the mechanism is identical — so this is what keeps a Purpose
 * screen from ever saying "nguồn tiền" and vice versa. ADR-0001's whole point
 * is that the two must not be confusable; sharing the code and separating the
 * words is how that survives someone editing one of them later.
 *
 * The words themselves live in the catalog, one subtree per dimension
 * (`dimensions.purpose`, `dimensions.fundingSource`), and `namespace` says
 * which. A word that is the *same* for both (the filters' "everything" chip)
 * does not belong in either subtree and lives with the component that renders
 * it. What each key is for:
 *
 * - `plural` — headings and counts.
 * - `question` — the prompt wherever the user is *choosing* one of these (the
 *   filter rows and the transaction form) and, word for word, the placeholder
 *   when *naming* one on the management screen: "what is the money for?" is
 *   the right hint for both. A question, not a noun: the person this app is
 *   for parses it faster than "Purpose", and the screen should say what to do
 *   rather than name an abstraction. Headings and table columns keep the
 *   short noun (`plural`), because there the word labels a thing rather than
 *   asks for a decision.
 * - `unknown` — the chip shown when a filter names something that no longer
 *   exists, an id left in a URL after the thing was renamed or deleted.
 *   Distinct from "everything" on purpose: without it, a filter matching zero
 *   rows would read exactly like no filter at all.
 * - `required` / `nameRequired` — the schemas' messages for an unanswered
 *   choice and a blank name.
 * - `errors.*` — what the shared actions in `dimensions.server.ts` answer.
 *
 * `queryKey` is the bare cache key for this dimension's own list, matching
 * `query-options.ts`; `invalidates` is every *other* key a write to this
 * dimension makes stale, spelled out rather than inferred.
 */
export type DimensionCopy = {
  queryKey: "purposes" | "fundingSources";
  /** Bare cache keys a create, rename or delete here invalidates. */
  invalidates: readonly string[];
  /** This dimension's subtree of the catalog. */
  namespace: DimensionNamespace;
};

export type DimensionNamespace =
  "dimensions.purpose" | "dimensions.fundingSource";

/**
 * The two subtrees must carry exactly the same keys. The components translate
 * through whichever `namespace` they were handed, so a key present for one
 * dimension and missing for the other is a word one screen shows and its twin
 * cannot — the drift ADR-0001 is about, moved from code into the catalog. This
 * fails to compile the moment the key sets differ, in either direction.
 */
type PurposeKeys = NestedKeyOf<Messages["dimensions"]["purpose"]>;
type FundingSourceKeys = NestedKeyOf<Messages["dimensions"]["fundingSource"]>;
type SameKeys<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
export const DIMENSION_KEYS_MATCH: SameKeys<PurposeKeys, FundingSourceKeys> =
  true;

export const PURPOSE_COPY: DimensionCopy = {
  queryKey: "purposes",
  /**
   * `shareLinks` is here because a link's scope is a list of Purposes: the
   * links screen renders their names, and deleting one detaches it from every
   * link that named it. Without this the management screen keeps showing a
   * Purpose that no longer exists, or the name it used to have.
   */
  invalidates: ["transactions", "overview", "shareLinks"],
  namespace: "dimensions.purpose",
};

export const FUNDING_SOURCE_COPY: DimensionCopy = {
  queryKey: "fundingSources",
  // No `shareLinks`: a link's scope is one-dimensional (ADR-0002), so nothing
  // about a Funding Source can change what a link shows in that list.
  invalidates: ["transactions", "overview"],
  namespace: "dimensions.fundingSource",
};

/**
 * The shape both dimensions' schemas share — a single required name.
 *
 * Typed against zod rather than `@standard-schema/spec` so this pulls in no
 * new dependency for one type: zod is already here, TanStack Form accepts a
 * zod schema as a Standard Schema, and `purposeSchema` / `fundingSourceSchema`
 * both match this exactly.
 */
export type DimensionSchema = z.ZodObject<{ name: z.ZodString }>;
