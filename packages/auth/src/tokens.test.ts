import { describe, it, expect } from "vitest";
import { generateToken, hashToken, tokensEqual } from "../src/tokens.js";

describe("tokens", () => {
  it("generates a token with correct byte length", () => {
    const token = generateToken();
    const decoded = Buffer.from(token, "base64url");
    expect(decoded.length).toBe(32);
  });

  it("generates unique tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });

  it("hashes a token deterministically", () => {
    const token = "test-token-value";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("hashes produce different values for different inputs", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("compares equal tokens correctly", () => {
    const token = generateToken();
    expect(tokensEqual(token, token)).toBe(true);
  });

  it("compares different tokens correctly", () => {
    expect(tokensEqual("abc123", "def456")).toBe(false);
  });

  it("compares different length tokens", () => {
    expect(tokensEqual("abc", "abcdef")).toBe(false);
  });
});
