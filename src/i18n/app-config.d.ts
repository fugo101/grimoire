import type messages from "../../messages/vi.json";
import type { AppLocale } from "./config";

/**
 * Types every `t()` / `useTranslations()` call against the Vietnamese catalog,
 * so a key that does not exist is a compile error rather than a key rendered
 * raw at runtime. The generated `messages/vi.d.json.ts` (see
 * `createMessagesDeclaration` in `next.config.ts`) narrows this further to the
 * ICU arguments each message takes.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
