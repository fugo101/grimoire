import "server-only";
import { headers } from "next/headers";
import { clientKey } from "@/lib/client-ip";

/**
 * The rate-limit key for the current request. Deliberately branch-free: every
 * decision lives in `clientKey`, which is testable without a Next
 * request context — this file is the only part that is not.
 */
export async function getClientKey(): Promise<string> {
  return clientKey((await headers()).get("cf-connecting-ip"));
}
