import { createHmac, timingSafeEqual } from "node:crypto";
import { CollaborationAccessClaimsSchema } from "@vega/contracts/collaboration-token";
import type { CollaborationAccessClaims } from "@vega/contracts/collaboration-token";

const SIGNING_ALGORITHM = "sha256";
const MIN_SECRET_BYTES = 32;
const TOKEN_SEPARATOR = ".";

export function validateSigningSecret(secret: string): void {
  const buf = Buffer.from(secret, "utf8");
  if (buf.length < MIN_SECRET_BYTES) {
    throw new Error(
      `Collaboration signing secret must be at least ${MIN_SECRET_BYTES} bytes, got ${buf.length}`,
    );
  }
}

function encodeClaims(claims: CollaborationAccessClaims): string {
  return Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
}

function decodeClaims(encoded: string): CollaborationAccessClaims {
  const json = Buffer.from(encoded, "base64url").toString("utf8");
  const parsed = JSON.parse(json) as unknown;
  return CollaborationAccessClaimsSchema.parse(parsed);
}

function signPayload(payload: string, secret: string): string {
  return createHmac(SIGNING_ALGORITHM, secret).update(payload).digest("base64url");
}

export function signCollaborationToken(claims: CollaborationAccessClaims, secret: string): string {
  validateSigningSecret(secret);
  const encoded = encodeClaims(claims);
  const signature = signPayload(encoded, secret);
  return `${encoded}${TOKEN_SEPARATOR}${signature}`;
}

export function verifyCollaborationToken(token: string, secret: string): CollaborationAccessClaims {
  validateSigningSecret(secret);

  const sepIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  if (sepIndex === -1) {
    throw new Error("Invalid collaboration token format");
  }

  const encoded = token.slice(0, sepIndex);
  const providedSig = token.slice(sepIndex + 1);
  const expectedSig = signPayload(encoded, secret);

  const providedBuf = Buffer.from(providedSig, "base64url");
  const expectedBuf = Buffer.from(expectedSig, "base64url");

  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    throw new Error("Collaboration token signature verification failed");
  }

  const claims = decodeClaims(encoded);

  const now = Date.now();
  if (claims.expiresAt <= now) {
    throw new Error("Collaboration token has expired");
  }

  return claims;
}
