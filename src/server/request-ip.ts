import "server-only";
import { headers } from "next/headers";
import { clientIpFromHeaders } from "@/lib/client-ip";

/**
 * The rate-limit key for the current request. Deliberately branch-free: every
 * decision lives in `clientIpFromHeaders`, which is testable without a Next
 * request context — this file is the only part that is not.
 */
export async function getClientIp(): Promise<string> {
  return clientIpFromHeaders((await headers()).get("cf-connecting-ip"));
}
