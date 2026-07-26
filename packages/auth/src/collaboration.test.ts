import { describe, it, expect } from "vitest";
import { signCollaborationToken, verifyCollaborationToken } from "../src/collaboration.js";

const SECRET = "a-32-byte-or-longer-secret-for-testing!";

describe("collaboration tokens", () => {
  const claims = {
    version: 1 as const,
    sessionId: "01933a4f-2a00-7000-8000-000000000001",
    guestId: "01933a4f-2a00-7000-8000-000000000002",
    roomId: "01933a4f-2a00-7000-8000-000000000003",
    role: "editor" as const,
    mode: "read-write" as const,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 300_000,
  };

  it("signs and verifies a valid token", () => {
    const token = signCollaborationToken(claims, SECRET);
    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const verified = verifyCollaborationToken(token, SECRET);
    expect(verified.sessionId).toBe(claims.sessionId);
    expect(verified.guestId).toBe(claims.guestId);
    expect(verified.roomId).toBe(claims.roomId);
    expect(verified.role).toBe("editor");
  });

  it("rejects token with wrong secret", () => {
    const token = signCollaborationToken(claims, SECRET);
    expect(() => verifyCollaborationToken(token, "different-secret-that-is-at-least-32-bytes!")).toThrow(
      "signature verification failed",
    );
  });

  it("rejects expired token", () => {
    const expiredClaims = {
      ...claims,
      issuedAt: Date.now() - 600_000,
      expiresAt: Date.now() - 1,
    };
    const token = signCollaborationToken(expiredClaims, SECRET);
    expect(() => verifyCollaborationToken(token, SECRET)).toThrow("expired");
  });

  it("rejects malformed token", () => {
    expect(() => verifyCollaborationToken("not-a-token", SECRET)).toThrow("format");
  });

  it("rejects tampered token claims", () => {
    const token = signCollaborationToken(claims, SECRET);
    const parts = token.split(".");
    const tampered = parts[0] + ".tampered-sig";
    expect(() => verifyCollaborationToken(tampered, SECRET)).toThrow("signature verification failed");
  });

  it("rejects short secret", () => {
    expect(() => signCollaborationToken(claims, "short")).toThrow("at least 32 bytes");
  });
});
