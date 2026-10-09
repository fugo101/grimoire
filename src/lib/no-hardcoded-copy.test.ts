import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

/**
 * The guard that keeps user-facing text in `messages/vi.json`: ESLint's
 * `no-restricted-syntax` rejects Vietnamese in a string literal, a template
 * or JSX text anywhere under `src/`. Run here against the real config, so a
 * selector that silently stops matching — a typo in the regex, a moved
 * `files` glob — fails a test instead of quietly letting strings back in.
 *
 * Every rejection is paired with a case that must pass, so a rule that
 * flagged *everything* would fail too.
 */
const eslint = new ESLint({ cwd: process.cwd() });

async function flagged(code: string, filePath: string): Promise<boolean> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.some((m) => m.ruleId === "no-restricted-syntax");
}

const COMPONENT = "src/features/example/example.tsx";

describe("no hardcoded Vietnamese copy", () => {
  it.each([
    ["JSX text", "export const A = () => <p>Xin chào</p>;"],
    ["a JSX attribute", 'export const A = () => <input placeholder="Tên" />;'],
    ["a string literal", 'export const label = "Đã lưu";'],
    ["a template literal", "export const f = (n: number) => `Còn ${n} ngày`;"],
  ])("rejects Vietnamese in %s", async (_, code) => {
    expect(await flagged(code, COMPONENT)).toBe(true);
  });

  it.each([
    ["a comment", "// Tiền dùng để làm gì?\nexport const x = 1;"],
    ["ASCII text", 'export const A = () => <p title="Grimoire">OK</p>;'],
    ["a currency sign and dashes", 'export const s = "1.000 ₫ — −5";'],
  ])("accepts %s", async (_, code) => {
    expect(await flagged(code, COMPONENT)).toBe(false);
  });

  it("leaves tests and test fixtures alone", async () => {
    const code = 'export const name = "Mục X";';
    expect(await flagged(code, "src/features/example/example.test.ts")).toBe(
      false
    );
    expect(await flagged(code, "src/test/fixtures.ts")).toBe(false);
    // The control: the same line outside a test is rejected.
    expect(await flagged(code, "src/lib/example.ts")).toBe(true);
  });
});
