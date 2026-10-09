"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  createToken,
  validateCredentials,
} from "@/lib/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { COOKIE_OPTIONS, requireAuthForAction } from "@/server/auth-guard";
import { getClientIp } from "@/server/request-ip";
import type { ActionState } from "@/lib/types";

/**
 * Deliberately unauthenticated, like `/api/public-report` — this is the
 * endpoint that establishes the session in the first place.
 *
 * Throttled per client before anything else runs, including input parsing: a
 * gate placed after `parse` could be skipped by sending a malformed payload.
 * A client that is locked out is refused even with the right password — that
 * is what makes it a limit rather than a suggestion.
 */
export async function login(input: LoginInput): Promise<ActionState> {
  const clientIp = await getClientIp();

  const limit = checkLoginRateLimit(clientIp);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
    return {
      success: false,
      error: `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutes} phút.`,
    };
  }

  // safeParse, not parse: a thrown ZodError crosses the action boundary as a
  // redacted rejection, never as an ActionState. The form validates with the
  // same schema first, so only a direct caller gets here — the one that
  // matters for throttling. Malformed input and wrong credentials share one
  // message, so the response is no oracle for which it was.
  const parsed = loginSchema.safeParse(input);
  if (
    !parsed.success ||
    !validateCredentials(parsed.data.username, parsed.data.password)
  ) {
    recordLoginFailure(clientIp);
    return { success: false, error: "Sai tên đăng nhập hoặc mật khẩu." };
  }

  // Cleared before the session is minted: a crash in between leaves a stale
  // failure count, not a stale lockout.
  clearLoginAttempts(clientIp);
  (await cookies()).set(
    SESSION_COOKIE_NAME,
    await createToken(),
    COOKIE_OPTIONS
  );
  return { success: true };
}

/**
 * Returns a plain success state rather than throwing a redirect — see the
 * plan's "Logout: evict, don't just invalidate" note. The dashboard shell
 * (PR 7) does the actual navigation client-side after this resolves.
 */
export async function logout(): Promise<ActionState> {
  const authError = await requireAuthForAction();
  if (authError) return authError;

  (await cookies()).delete(SESSION_COOKIE_NAME);
  return { success: true };
}
