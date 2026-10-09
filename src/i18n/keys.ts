import type {
  ICUArgs,
  MessageKeys,
  Messages,
  NestedKeyOf,
  NestedValueOf,
} from "next-intl";

/** Any leaf key of the catalog, e.g. `"validation.amountPositive"`. */
export type MessageKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

/** What a message interpolates, once it travels without its key's typing. */
export type MessageValues = Record<string, string | number>;

/**
 * The ICU arguments the message at `K` takes, read from the generated
 * `messages/vi.d.json.ts` — `{minutes, number}` becomes `{ minutes: number }`.
 */
type MessageArgs<K extends MessageKey> = ICUArgs<
  Extract<NestedValueOf<Messages, K>, string>,
  { ICUArgument: string; ICUNumberArgument: number; ICUDateArgument: never }
>;

/**
 * Marks a string as a catalog key where no translator is available — the
 * module-level schemas in `schemas.ts`, the errors a dimension can raise. It
 * returns its argument unchanged: the point is the type, which turns a
 * misspelt key into a compile error at the place it was written instead of a
 * fallback message on screen. See ADR-0004 for why these carry keys at all.
 */
export function msg<const K extends MessageKey>(key: K): K {
  return key;
}

/**
 * A user-facing failure as a Server Action reports it: a key and the values its
 * message interpolates. Translated on the client, where the locale is known —
 * the action needs no request-scoped i18n, and its tests compare keys rather
 * than prose.
 */
export type ActionError = {
  key: MessageKey;
  values?: MessageValues;
};

/**
 * Builds an `ActionError`, checking `values` against the message's own ICU
 * arguments: a message with `{minutes, number}` cannot be returned without a
 * numeric `minutes`, and one with no arguments takes none. The values lose
 * that per-key typing once they are on the wire — see `DynamicTranslator` —
 * so this is the one place the producer side is held to the catalog.
 */
export function actionError<const K extends MessageKey>(
  key: K,
  ...values: object extends MessageArgs<K> ? [] : [values: MessageArgs<K>]
): ActionError {
  return values.length > 0
    ? { key, values: values[0] as MessageValues }
    : { key };
}

/**
 * Whether `key` names a message — a string leaf — in `messages`. Stricter than
 * next-intl's `t.has()`, which also answers true for a namespace such as
 * `"validation"`, whose value is an object `t()` cannot render.
 */
export function isMessageKey(
  messages: unknown,
  key: string
): key is MessageKey {
  let node = messages;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object" || !Object.hasOwn(node, part)) {
      return false;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}

/**
 * A translator for a key only known at runtime — an `ActionError` off the
 * wire, a schema message inside `<FieldError>`. next-intl types `t()` per key,
 * and a call over the whole `MessageKey` union demands every message's ICU
 * arguments at once, so these two boundaries call it through this looser
 * signature. Everywhere a key is written literally, `t()` keeps its full
 * per-key typing.
 */
export type DynamicTranslator = (
  key: MessageKey,
  values?: MessageValues
) => string;
