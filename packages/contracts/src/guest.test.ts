import { describe, it, expect } from "vitest";
import {
  CreateGuestSessionRequestSchema,
  PublicGuestSchema,
  CreateGuestSessionResponseSchema,
  isSessionError,
} from "../src/guest.js";

describe("guest schemas", () => {
  it("validates a correct guest session request", () => {
    const result = CreateGuestSessionRequestSchema.safeParse({
      username: "Alice",
      email: "alice@test.example",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("alice@test.example");
      expect(result.data.username).toBe("Alice");
    }
  });

  it("normalises email to lowercase", () => {
    const result = CreateGuestSessionRequestSchema.safeParse({
      username: "Bob",
      email: "BOB@TEST.EXAMPLE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("bob@test.example");
    }
  });

  it("rejects short username", () => {
    const result = CreateGuestSessionRequestSchema.safeParse({
      username: "A",
      email: "a@test.example",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = CreateGuestSessionRequestSchema.safeParse({
      username: "Alice",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("validates public guest shape", () => {
    const result = PublicGuestSchema.safeParse({
      id: "01933a4f-2a00-7000-8000-000000000001",
      username: "Alice",
      colour: "#ff0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects public guest missing id", () => {
    const result = PublicGuestSchema.safeParse({
      id: "not-a-uuid",
      username: "Alice",
      colour: "#ff0000",
    });
    expect(result.success).toBe(false);
  });

  it("validates response with session expiry", () => {
    const result = CreateGuestSessionResponseSchema.safeParse({
      guest: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        username: "Alice",
        colour: "#ff0000",
      },
      session: {
        expiresAt: "2026-07-27T12:00:00.000Z",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects response without guest email", () => {
    const result = CreateGuestSessionResponseSchema.safeParse({
      guest: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        username: "Alice",
        colour: "#ff0000",
      },
      session: {
        expiresAt: "2026-07-27T12:00:00.000Z",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.guest).not.toHaveProperty("email");
    }
  });

  it("recognises session error codes", () => {
    expect(isSessionError("SESSION_INVALID")).toBe(true);
    expect(isSessionError("SESSION_EXPIRED")).toBe(true);
    expect(isSessionError("SESSION_REVOKED")).toBe(true);
    expect(isSessionError("VALIDATION_FAILED")).toBe(false);
  });
});
