import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE } from "./config";

/**
 * next-intl "without i18n routing": the locale never appears in a URL, so this
 * touches neither the route tree, `typedRoutes`, nor the redirects in
 * `next.config.ts`.
 *
 * The single place a request's locale is decided. It is a constant today on
 * purpose: how a request should choose once there is a second language — a
 * cookie, `Accept-Language`, and what a `/p/[code]` reader who never signs in
 * gets — is a decision for the change that adds that language, not one to
 * guess at with only Vietnamese to choose from.
 */
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
