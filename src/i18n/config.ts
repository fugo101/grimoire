/**
 * The locales this build ships a catalog for. `messages/vi.json` is the source
 * of truth; adding a language means adding its file here and in `messages/`,
 * then deciding how a request picks one — see `request.ts`.
 */
export const LOCALES = ["vi"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "vi";
