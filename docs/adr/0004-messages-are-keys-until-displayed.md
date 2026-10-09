# Messages are keys until displayed

Date: 2026-10-09

## Status

Accepted.

## Context

Issue #117 moved every user-facing string into a next-intl catalog (`messages/vi.json`). Two kinds of message are produced in places that have no translator in scope:

- **Validation messages.** `src/lib/schemas.ts` is module-level and shared by TanStack Form, the Server Actions and the Route Handlers.
- **Business-rule failures** that Server Actions return in `ActionState.error`: a name already taken, a Purpose that still has Transactions, a login lockout.

The text has to be picked somewhere, and choosing the wrong place would mean reworking all three of those layers.

## Decision

A message stays a catalog key all the way to the component that shows it, and gets translated there.

- **Schemas carry typed keys** through `msg()` (`src/i18n/keys.ts`), an identity function whose parameter type is every leaf key in the catalog. A misspelt key fails to compile where it was written. `<FieldError>` is the single place a schema message turns into words. It translates the key, and it falls back to `validation.invalid` for anything that is not a key, such as Zod's English default for a constraint nobody labelled. That means every constraint a user can trip must carry a key, and `src/lib/schemas.test.ts` enumerates them.
- **`ActionState.error` is `{ key, values? }`**, and the client translates it through `useErrorMessage()`. Actions return keys, not prose.
- **Route Handler error bodies are fixed English machine codes** (`"invalid_params"`, `"unauthorized"`), not catalog keys. `fetchJson` throws on the status and never reads the body, so they are protocol rather than UI.

## Considered options

- **A schema factory, `(t) => schema`.** Every caller would need a translator just to validate: the forms, every Server Action and every Route Handler. Schema types would have to come from `ReturnType<...>`. Server-side callers would need request-scoped i18n to check input that no user ever reads the message of. That is because a Zod failure inside an action throws and is redacted by Next, so only the form ever shows a validation message.
- **Zod's global error map (`z.config({ customError })`).** A message written on the schema takes precedence over the global map, so the map cannot translate the schemas' own messages. It is also state for the whole process, so it cannot follow the locale of each request.
- **Actions return translated strings via `getTranslations()`.** `ActionState` would stay a string, but every action test would need next-intl's request context mocked. Tests would also go back to matching Vietnamese prose with regexes instead of comparing keys.

## Consequences

- A message's ICU arguments are checked where an action builds the error: `actionError(key, values)` takes exactly the arguments that message declares. On the wire they travel as untyped `values`, because a key only known at runtime cannot be checked against its message. `DynamicTranslator` loosens `t()` at exactly the two display boundaries, `<FieldError>` and `useErrorMessage()`. Every `t("...")` call with a key written in code keeps next-intl's full checking of keys and arguments.
- Schema messages live under `validation`, and action errors under `errors`. The exception is a word that differs between the two dimensions: it lives in that dimension's subtree (`dimensions.purpose.required`, `dimensions.purpose.errors.inUse`), where the parity assertion below can see it.
- The words that differ between the two dimensions sit in two sibling subtrees, `dimensions.purpose` and `dimensions.fundingSource`. A type assertion in `dimension-copy.ts` fails to compile when their key sets differ. This keeps ADR-0001's guarantee that the two dimensions are never confusable, now that the words live in the catalog rather than in code.
