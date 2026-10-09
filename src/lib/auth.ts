import { timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";

/**
 * HS256 keys the length of the digest or longer; anything shorter is brute
 * forceable offline against a single captured cookie. The 32-char floor is what
 * .env.example and CLAUDE.md have always documented — this enforces it.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * The sample value .env.example used to ship. It is 33 characters, so the
 * length floor passes it — but it is published in a public repository, and
 * anyone holding it can mint an admin session without ever seeing the login
 * form. Being a known value is the risk, not being short. Checked before the
 * length so the operator gets a message that says what to do.
 */
const PLACEHOLDER_SECRET = "your-secret-key-at-least-32-chars";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  if (secret === PLACEHOLDER_SECRET) {
    throw new Error(
      "AUTH_SECRET is still the .env.example placeholder — generate one with `openssl rand -base64 32`"
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${secret.length})`
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Force the AUTH_SECRET checks above to run now rather than on the first login.
 *
 * `getSecret` is lazy, so without this a server misconfigured with a weak or
 * missing secret boots clean and only fails later, at a request — which reads
 * as a login bug rather than a deployment one. Called from
 * src/instrumentation.node.ts beside the migrations, the other thing that has
 * to be right before traffic arrives.
 */
export function assertAuthSecret(): void {
  getSecret();
}

/**
 * Values shipped in .env.example and docker-compose.yml at one time or
 * another. Rejected by exact (case-insensitive) match rather than by a
 * strength heuristic: these are precisely the strings a deployment ends up
 * with when nobody overrides them.
 */
const DEFAULT_PASSWORDS = new Set(["changeme", "password", "admin", "123456"]);

/**
 * Refuse to boot with admin credentials that are missing or a shipped default.
 *
 * Unlike `assertAuthSecret`, there is no lazy getter to force early here —
 * `validateCredentials` reads `process.env` on every call. This is a policy of
 * its own: without it, a missing password boots clean and every login fails
 * with no diagnostic, and a default one boots clean and lets anyone in.
 */
export function assertAdminCredentials(): void {
  // The exact untrimmed strings validateCredentials compares against, so what
  // is checked at boot is byte-for-byte what is used at login.
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!username.trim()) throw new Error("ADMIN_USERNAME is not set");
  // Not exploitable today — loginSchema's .min(1) keeps an empty submission
  // from ever reaching timingSafeStringEqual("", ""), which would match — but
  // it makes login impossible, and it stops being safe the moment someone
  // relaxes that schema.
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  if (DEFAULT_PASSWORDS.has(password.toLowerCase())) {
    throw new Error(
      "ADMIN_PASSWORD is still a shipped default — set a real password in .env"
    );
  }
}

/** The only subject this app ever issues, and the only one it accepts. */
const ADMIN_SUBJECT = "admin";

export async function createToken(): Promise<string> {
  return new SignJWT({ sub: ADMIN_SUBJECT })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // A valid signature only proves the token was minted with AUTH_SECRET, not
    // that it was minted by createToken. Checking the claim keeps this honest
    // if that secret is ever reused for a second kind of token.
    if (payload.sub !== ADMIN_SUBJECT) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

/** Constant-time compare — a plain `===` leaks timing information a network attacker can use to guess characters one at a time. */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths, so pad to equal length
  // first — comparing against a same-length buffer still keeps the
  // comparison itself constant-time; only the length check is length-leaky,
  // which is unavoidable and not the information being protected here.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function validateCredentials(
  username: string,
  password: string
): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  return (
    timingSafeStringEqual(username, expectedUsername) &&
    timingSafeStringEqual(password, expectedPassword)
  );
}
