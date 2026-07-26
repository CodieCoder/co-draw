import { describe, it, expect } from "vitest";
import {
  CreateRoomRequestSchema,
  CreateRoomResponseSchema,
  GetRoomResponseSchema,
  deriveCapabilities,
} from "../src/room.js";

describe("room schemas", () => {
  it("validates room creation request with name", () => {
    const result = CreateRoomRequestSchema.safeParse({ name: "My Canvas" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Canvas");
    }
  });

  it("validates room creation request without name", () => {
    const result = CreateRoomRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty room name", () => {
    const result = CreateRoomRequestSchema.safeParse({ name: "  " });
    expect(result.success).toBe(false);
  });

  it("validates create room response", () => {
    const result = CreateRoomResponseSchema.safeParse({
      room: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        name: "Untitled Canvas",
        status: "active",
        role: "owner",
        createdAt: "2026-07-26T12:00:00.000Z",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates get room response with capabilities", () => {
    const result = GetRoomResponseSchema.safeParse({
      room: {
        id: "01933a4f-2a00-7000-8000-000000000001",
        name: "Test Room",
        status: "active",
        createdAt: "2026-07-26T12:00:00.000Z",
        updatedAt: "2026-07-26T12:30:00.000Z",
      },
      membership: {
        guestId: "01933a4f-2a00-7000-8000-000000000002",
        role: "owner",
      },
      capabilities: {
        canView: true,
        canEdit: true,
        canUploadAssets: true,
        canManageMembers: true,
        canArchive: true,
        canRestore: true,
        canExport: true,
        canUsePhysics: false,
      },
    });
    expect(result.success).toBe(true);
  });

  it("derives owner capabilities", () => {
    const caps = deriveCapabilities("owner");
    expect(caps.canEdit).toBe(true);
    expect(caps.canManageMembers).toBe(true);
    expect(caps.canArchive).toBe(true);
  });

  it("derives editor capabilities", () => {
    const caps = deriveCapabilities("editor");
    expect(caps.canEdit).toBe(true);
    expect(caps.canManageMembers).toBe(false);
    expect(caps.canArchive).toBe(false);
  });

  it("derives viewer capabilities", () => {
    const caps = deriveCapabilities("viewer");
    expect(caps.canEdit).toBe(false);
    expect(caps.canView).toBe(true);
    expect(caps.canManageMembers).toBe(false);
  });
});
