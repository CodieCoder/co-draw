import { describe, it, expect } from "vitest";
import {
  CollaborationAccessClaimsSchema,
  CollaborationBootstrapResponseSchema,
  documentNameForRoom,
  collaborationModeForRole,
} from "../src/collaboration-token.js";

describe("collaboration token schemas", () => {
  it("validates correct claims", () => {
    const result = CollaborationAccessClaimsSchema.safeParse({
      version: 1,
      sessionId: "01933a4f-2a00-7000-8000-000000000001",
      guestId: "01933a4f-2a00-7000-8000-000000000002",
      roomId: "01933a4f-2a00-7000-8000-000000000003",
      role: "editor",
      mode: "read-write",
      issuedAt: 1000,
      expiresAt: 2000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects wrong version", () => {
    const result = CollaborationAccessClaimsSchema.safeParse({
      version: 2,
      sessionId: "01933a4f-2a00-7000-8000-000000000001",
      guestId: "00000000-0000-0000-0000-000000000002",
      roomId: "00000000-0000-0000-0000-000000000003",
      role: "editor",
      mode: "read-write",
      issuedAt: 1000,
      expiresAt: 2000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = CollaborationAccessClaimsSchema.safeParse({
      version: 1,
      sessionId: "01933a4f-2a00-7000-8000-000000000001",
    });
    expect(result.success).toBe(false);
  });

  it("validates bootstrap response", () => {
    const result = CollaborationBootstrapResponseSchema.safeParse({
      room: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        status: "active",
      },
      guest: {
        id: "01933a4f-2a00-7000-8000-000000000002",
        username: "Alice",
        colour: "#ff0000",
      },
      access: {
        role: "owner",
        mode: "read-write",
      },
      collaboration: {
        documentName: "room:01933a4f-2a00-7000-8000-000000000001",
        websocketUrl: "ws://localhost:1234",
        accessToken: "abc.def",
        expiresAt: "2026-07-26T12:05:00.000Z",
        schemaVersion: 1,
      },
    });
    expect(result.success).toBe(true);
  });

  it("formats document name correctly", () => {
    expect(documentNameForRoom("abc-123")).toBe("room:abc-123");
  });

  it("assigns read-write mode for owner and editor", () => {
    expect(collaborationModeForRole("owner")).toBe("read-write");
    expect(collaborationModeForRole("editor")).toBe("read-write");
  });

  it("assigns read-only mode for viewer", () => {
    expect(collaborationModeForRole("viewer")).toBe("read-only");
  });
});
