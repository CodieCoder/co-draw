import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

import {
  AssetServiceError,
  createImageAsset,
  decodeImageDataUrl,
} from "./asset.service.js";

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

function editorMembership() {
  return { rows: [{ status: "active", role: "editor" }] };
}

function ownerMembership() {
  return { rows: [{ status: "active", role: "owner" }] };
}

function viewerMembership() {
  return { rows: [{ status: "active", role: "viewer" }] };
}

function archivedRoom() {
  return { rows: [{ status: "archived", role: "editor" }] };
}

function emptyResult() {
  return { rows: [] };
}

describe("private image asset service", () => {
  describe("decodeImageDataUrl", () => {
    it("validates declared MIME type against binary signature", () => {
      expect(decodeImageDataUrl(PNG_DATA_URL, "image/png")).toHaveLength(24);
      expect(() => decodeImageDataUrl(PNG_DATA_URL, "image/jpeg")).toThrow(
        new AssetServiceError("type"),
      );
    });

    it("rejects empty base64 payload", () => {
      expect(() =>
        decodeImageDataUrl("data:image/png;base64,", "image/png"),
      ).toThrow(new AssetServiceError("type"));
    });

    it("rejects over-size payload", () => {
      const prefix = "data:image/png;base64,";
      const huge = prefix + "A".repeat(20_000_000);
      expect(() => decodeImageDataUrl(huge, "image/png")).toThrow(
        new AssetServiceError("size"),
      );
    });

    it("rejects non-base64 characters in payload", () => {
      expect(() =>
        decodeImageDataUrl(
          "data:image/png;base64,!!!invalid!!!",
          "image/png",
        ),
      ).toThrow(new AssetServiceError("type"));
    });

    it("detects PNG signature", () => {
      const bytes = decodeImageDataUrl(PNG_DATA_URL, "image/png");
      expect(bytes[0]).toBe(0x89);
      expect(bytes[1]).toBe(0x50);
      expect(bytes[2]).toBe(0x4e);
      expect(bytes[3]).toBe(0x47);
    });

    it("detects JPEG signature", () => {
      const bytes = decodeImageDataUrl(
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD",
        "image/jpeg",
      );
      expect(bytes[0]).toBe(0xff);
      expect(bytes[1]).toBe(0xd8);
      expect(bytes[2]).toBe(0xff);
    });
  });

  describe("createImageAsset", () => {
    it("rejects unsupported MIME type", async () => {
      const query = vi.fn();
      const client = { query } as unknown as PoolClient;
      await expect(
        createImageAsset(client, {
          roomId: "11111111-1111-4111-8111-111111111111",
          guestId: "22222222-2222-4222-8222-222222222222",
          mimeType: "image/gif",
          sizeBytes: 100,
        }),
      ).rejects.toEqual(new AssetServiceError("type"));
      expect(query).not.toHaveBeenCalled();
    });

    it("rejects zero sizeBytes", async () => {
      const query = vi.fn();
      const client = { query } as unknown as PoolClient;
      await expect(
        createImageAsset(client, {
          roomId: "11111111-1111-4111-8111-111111111111",
          guestId: "22222222-2222-4222-8222-222222222222",
          mimeType: "image/png",
          sizeBytes: 0,
        }),
      ).rejects.toEqual(new AssetServiceError("size"));
    });

    it("rejects over-size image", async () => {
      const client = { query: vi.fn() } as unknown as PoolClient;
      await expect(
        createImageAsset(client, {
          roomId: "11111111-1111-4111-8111-111111111111",
          guestId: "22222222-2222-4222-8222-222222222222",
          mimeType: "image/png",
          sizeBytes: 11_000_000,
        }),
      ).rejects.toEqual(new AssetServiceError("size"));
    });

    it("rejects viewers before creating asset metadata", async () => {
      const query = vi.fn().mockResolvedValue(viewerMembership());
      const client = { query } as unknown as PoolClient;

      await expect(
        createImageAsset(client, {
          roomId: "11111111-1111-4111-8111-111111111111",
          guestId: "22222222-2222-4222-8222-222222222222",
          mimeType: "image/png",
          sizeBytes: 24,
        }),
      ).rejects.toEqual(new AssetServiceError("forbidden"));
      expect(query).toHaveBeenCalledTimes(1);
    });

    it("rejects non-members", async () => {
      const query = vi.fn().mockResolvedValue(emptyResult());
      const client = { query } as unknown as PoolClient;

      await expect(
        createImageAsset(client, {
          roomId: "11111111-1111-4111-8111-111111111111",
          guestId: "22222222-2222-4222-8222-222222222222",
          mimeType: "image/png",
          sizeBytes: 24,
        }),
      ).rejects.toEqual(new AssetServiceError("not_found"));
    });

    it("rejects archived rooms", async () => {
      const query = vi.fn().mockResolvedValue(archivedRoom());
      const client = { query } as unknown as PoolClient;

      await expect(
        createImageAsset(client, {
          roomId: "11111111-1111-4111-8111-111111111111",
          guestId: "22222222-2222-4222-8222-222222222222",
          mimeType: "image/png",
          sizeBytes: 24,
        }),
      ).rejects.toEqual(new AssetServiceError("archived"));
    });

    it("allows owners to create assets", async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce(ownerMembership())
        .mockResolvedValueOnce({
          rows: [
            {
              id: "33333333-3333-4333-8333-333333333333",
              room_id: "11111111-1111-4111-8111-111111111111",
              created_by_guest_id: "22222222-2222-4222-8222-222222222222",
              kind: "image",
              status: "pending",
              storage_key:
                "rooms/11111111-1111-4111-8111-111111111111/assets/33333333-3333-4333-8333-333333333333",
              original_filename: null,
              mime_type: "image/png",
              size_bytes: 24,
              ready_at: null,
            },
          ],
        });
      const client = { query } as unknown as PoolClient;

      const result = await createImageAsset(client, {
        roomId: "11111111-1111-4111-8111-111111111111",
        guestId: "22222222-2222-4222-8222-222222222222",
        mimeType: "image/png",
        sizeBytes: 24,
      });
      expect(result.status).toBe("pending");
      expect(result.kind).toBe("image");
    });

    it("generates a private storage key without guest identity", async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce(editorMembership())
        .mockImplementationOnce((_sql: string, values: unknown[]) => ({
          rows: [
            {
              id: values[0] as string,
              room_id: values[1] as string,
              created_by_guest_id: values[2] as string,
              kind: "image",
              status: "pending",
              storage_key: values[3] as string,
              original_filename: null,
              mime_type: values[5] as string,
              size_bytes: values[6] as number,
              ready_at: null,
            },
          ],
        }));
      const client = { query } as unknown as PoolClient;

      const result = await createImageAsset(client, {
        roomId: "11111111-1111-4111-8111-111111111111",
        guestId: "22222222-2222-4222-8222-222222222222",
        mimeType: "image/png",
        sizeBytes: 24,
      });
      expect(result.status).toBe("pending");
      const values = query.mock.calls[1]?.[1] as unknown[];
      expect(String(values[3])).toMatch(
        /^rooms\/11111111-1111-4111-8111-111111111111\/assets\/[0-9a-f-]{36}$/u,
      );
      expect(String(values[3])).not.toContain("22222222");
    });
  });
});
