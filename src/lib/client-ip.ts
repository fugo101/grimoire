import { isIP } from "node:net";

/**
 * The client key every request without a usable client IP shares.
 *
 * Production always carries `CF-Connecting-IP` (see docs/adr/0001-cloudflare-tunnel-ingress.md), so this bucket
 * only fills in local development or if the ingress chain ever changes. One
 * shared bucket is the fail-safe reading of that: it throttles everyone
 * together rather than letting a header-less caller go unthrottled.
 */
export const UNKNOWN_CLIENT_KEY = "unknown";

/**
 * The rate-limit key for a request, from its `CF-Connecting-IP` header value:
 * the IPv4 address, the IPv6 /64, or `UNKNOWN_CLIENT_KEY`.
 *
 * Only that header is read. Behind the Cloudflare Tunnel the rightmost
 * `X-Forwarded-For` entry is always an internal hop (cloudflared or Traefik),
 * so falling back to it would bucket every visitor together — exactly what
 * `UNKNOWN_CLIENT_KEY` already does, with less to get wrong.
 */
export function clientKey(cfConnectingIp: string | null): string {
  if (cfConnectingIp === null) return UNKNOWN_CLIENT_KEY;
  return normalizeClientIp(cfConnectingIp) ?? UNKNOWN_CLIENT_KEY;
}

const IPV4_MAPPED_PREFIX = "::ffff:";

/**
 * One key per client: the bare address for IPv4, the /64 for IPv6. A single
 * subscriber is usually handed a whole /64, so keying on the full IPv6
 * address would give them 2^64 fresh buckets to rotate through.
 */
function normalizeClientIp(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  const version = isIP(value);
  if (version === 4) return value;
  if (version !== 6) return null;

  if (value.startsWith(IPV4_MAPPED_PREFIX)) {
    const v4 = value.slice(IPV4_MAPPED_PREFIX.length);
    if (isIP(v4) === 4) return v4;
  }
  return `${ipv6Groups(value).slice(0, 4).join(":")}::/64`;
}

/** The eight groups of a valid IPv6 address, `::` expanded, leading zeros dropped. */
function ipv6Groups(address: string): string[] {
  // An embedded dotted IPv4 tail occupies the last two groups. Only its
  // count matters here — /64 keeps the first four — so it becomes zeros.
  const split = (part: string | undefined) =>
    part
      ? part.split(":").flatMap((g) => (g.includes(".") ? ["0", "0"] : [g]))
      : [];
  const [head, tail] = address.split("::");
  const headGroups = split(head);
  const tailGroups = split(tail);
  const groups =
    tail === undefined
      ? headGroups
      : [
          ...headGroups,
          ...Array<string>(8 - headGroups.length - tailGroups.length).fill("0"),
          ...tailGroups,
        ];
  return groups.map((g) => g.replace(/^0+(?=.)/, ""));
}
