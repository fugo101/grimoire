import { describe, expect, it } from "vitest";
import { UNKNOWN_CLIENT_KEY, clientKey } from "@/lib/client-ip";

describe("clientKey", () => {
  it("returns the CF-Connecting-IP address (positive control)", () => {
    expect(clientKey("203.0.113.7")).toBe("203.0.113.7");
  });

  it("falls back to one shared bucket when the header is missing", () => {
    expect(clientKey(null)).toBe(UNKNOWN_CLIENT_KEY);
  });

  it("ignores surrounding whitespace", () => {
    expect(clientKey("  203.0.113.7 ")).toBe("203.0.113.7");
  });

  it("keys an IPv4-mapped IPv6 address the same as the bare IPv4", () => {
    expect(clientKey("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  // One subscriber typically owns a whole /64, so keying on the full address
  // would hand them 2^64 fresh buckets.
  it("collapses two addresses in the same IPv6 /64 into one key", () => {
    expect(clientKey("2001:db8:1:2:aaaa::1")).toBe("2001:db8:1:2::/64");
    expect(clientKey("2001:DB8:1:2:bbbb:cccc:dddd:eeee")).toBe(
      "2001:db8:1:2::/64"
    );
  });

  it("keeps different IPv6 /64s apart", () => {
    expect(clientKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(clientKey("2001:db8:0:1::1")).toBe("2001:db8:0:1::/64");
  });

  it("treats a value that is not an IP address as unknown", () => {
    expect(clientKey("not-an-ip")).toBe(UNKNOWN_CLIENT_KEY);
    expect(clientKey("")).toBe(UNKNOWN_CLIENT_KEY);
    expect(clientKey("1".repeat(46))).toBe(UNKNOWN_CLIENT_KEY);
  });
});
