import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GlobalError from "@/app/global-error";
import RootError from "@/app/error";
import PublicError from "@/app/p/[code]/error";
import { messages, withIntl } from "@/test/intl";

const text = (html: string) => html.replace(/<[^>]+>/g, "\n");
const reset = () => {};

/**
 * The three error boundaries only render when something has already gone
 * wrong, which is exactly when nobody is watching them — so they are rendered
 * here instead of waiting for a real failure to find out their words are
 * missing.
 */
describe("error boundaries", () => {
  it("global-error brings its own catalog, with no provider above it", () => {
    // Rendered bare on purpose: global-error replaces the root layout, so the
    // layout's NextIntlClientProvider does not exist when it runs.
    const html = renderToStaticMarkup(
      <GlobalError error={new Error("x")} reset={reset} />
    );
    expect(text(html)).toContain(messages.app.error.title);
    expect(text(html)).toContain(messages.app.error.retry);
    expect(html).toContain(`lang="vi"`);
  });

  it("the root and public error pages read the catalog through the layout's provider", () => {
    const root = text(
      renderToStaticMarkup(
        withIntl(<RootError error={new Error("x")} reset={reset} />)
      )
    );
    expect(root).toContain(messages.app.error.description);
    expect(root).toContain(messages.app.home);

    const shared = text(renderToStaticMarkup(withIntl(<PublicError />)));
    expect(shared).toContain(messages.publicReport.error.title);
    expect(shared).toContain(messages.publicReport.error.reload);
  });

  it("fails loudly without a provider (control)", () => {
    // What would happen to global-error if it did not supply its own.
    expect(() =>
      renderToStaticMarkup(<RootError error={new Error("x")} reset={reset} />)
    ).toThrow();
  });
});
