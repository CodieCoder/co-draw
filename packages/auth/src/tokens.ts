import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

export const TOKEN_BYTES = 32;
export const TOKEN_ENCODING = "base64url" as const;
export const HASH_ENCODING = "hex" as const;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString(TOKEN_ENCODING);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest(HASH_ENCODING);
}

export function tokensEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
