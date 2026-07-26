import { describe, it, expect } from "vitest";
import {
  CreateShareLinkRequestSchema,
  CreateShareLinkResponseSchema,
  ResolveShareLinkResponseSchema,
  AcceptShareLinkResponseSchema,
} from "../src/share-links.js";

describe("share link schemas", () => {
  it("validates create share link with editor role", () => {
    const result = CreateShareLinkRequestSchema.safeParse({
      defaultRole: "editor",
    });
    expect(result.success).toBe(true);
  });

  it("rejects viewer links because this demo slice is editor-only", () => {
    const result = CreateShareLinkRequestSchema.safeParse({
      defaultRole: "viewer",
      expiresAt: "2026-07-27T12:00:00.000Z",
      maxUses: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = CreateShareLinkRequestSchema.safeParse({
      defaultRole: "owner",
    });
    expect(result.success).toBe(false);
  });

  it("validates create share link response with URL", () => {
    const result = CreateShareLinkResponseSchema.safeParse({
      shareLink: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        url: "http://localhost:5173/invite/abc123",
        defaultRole: "editor",
        createdAt: "2026-07-26T12:00:00.000Z",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates resolve share link response", () => {
    const result = ResolveShareLinkResponseSchema.safeParse({
      room: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        name: "Test Room",
        status: "active",
      },
      invitation: {
        defaultRole: "editor",
        requiresGuestSession: false,
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates accept share link response", () => {
    const result = AcceptShareLinkResponseSchema.safeParse({
      room: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        name: "Test Room",
        status: "active",
      },
      membership: {
        role: "editor",
      },
    });
    expect(result.success).toBe(true);
  });
});
