import { describe, expect, it } from "vitest";

import {
  imageMappingKey,
  parseImageAssetMapping,
  type ImageAssetMapping,
} from "./image-assets.js";

const VALID_MAPPING: ImageAssetMapping = {
  kind: "image",
  assetId: "01933a4f-2a00-7000-8000-000000000001",
  mimeType: "image/png",
  status: "ready",
  createdAt: "2026-07-26T12:00:00.000Z",
};

describe("image asset mappings", () => {
  describe("parseImageAssetMapping", () => {
    it("accepts only stable ready image mappings", () => {
      expect(parseImageAssetMapping(VALID_MAPPING)).toMatchObject({
        status: "ready",
        mimeType: "image/png",
      });
    });

    it("rejects non-image kind", () => {
      expect(
        parseImageAssetMapping({ ...VALID_MAPPING, kind: "audio" }),
      ).toBeNull();
    });

    it("rejects non-ready status", () => {
      expect(
        parseImageAssetMapping({ ...VALID_MAPPING, status: "pending" }),
      ).toBeNull();
      expect(
        parseImageAssetMapping({ ...VALID_MAPPING, status: "uploading" }),
      ).toBeNull();
      expect(
        parseImageAssetMapping({ ...VALID_MAPPING, status: "failed" }),
      ).toBeNull();
    });

    it("rejects unsupported MIME types", () => {
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          mimeType: "image/svg+xml",
        }),
      ).toBeNull();
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          mimeType: "image/gif",
        }),
      ).toBeNull();
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          mimeType: "image/bmp",
        }),
      ).toBeNull();
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          mimeType: "image/avif",
        }),
      ).toBeNull();
    });

    it("accepts JPEG and WebP MIME types", () => {
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          mimeType: "image/jpeg",
        }),
      ).not.toBeNull();
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          mimeType: "image/webp",
        }),
      ).not.toBeNull();
    });

    it("rejects malformed asset IDs", () => {
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          assetId: "not-a-uuid",
        }),
      ).toBeNull();
      expect(
        parseImageAssetMapping({
          ...VALID_MAPPING,
          assetId: "",
        }),
      ).toBeNull();
    });

    it("rejects missing createdAt", () => {
      expect(
        parseImageAssetMapping({
          kind: "image",
          assetId: "01933a4f-2a00-7000-8000-000000000001",
          mimeType: "image/png",
          status: "ready",
        }),
      ).toBeNull();
    });

    it("rejects null and non-object values", () => {
      expect(parseImageAssetMapping(null)).toBeNull();
      expect(parseImageAssetMapping(42)).toBeNull();
      expect(parseImageAssetMapping("string")).toBeNull();
      expect(parseImageAssetMapping([])).toBeNull();
    });

    it("accepts full valid mapping across all supported MIME types", () => {
      const validMappings = [
        { ...VALID_MAPPING, mimeType: "image/png" as const },
        { ...VALID_MAPPING, mimeType: "image/jpeg" as const },
        { ...VALID_MAPPING, mimeType: "image/webp" as const },
      ];
      for (const mapping of validMappings) {
        const parsed = parseImageAssetMapping(mapping);
        expect(parsed).toMatchObject({
          kind: "image",
          status: "ready",
          mimeType: mapping.mimeType,
        });
      }
    });
  });

  describe("imageMappingKey", () => {
    it("names the Yjs mapping without embedding a URL", () => {
      expect(imageMappingKey("file-1")).toBe("asset:image:file-1");
    });

    it("includes the prefix for all file IDs", () => {
      const key = imageMappingKey(
        "01933a4f-2a00-7000-8000-000000000001",
      );
      expect(key).toBe(
        "asset:image:01933a4f-2a00-7000-8000-000000000001",
      );
      expect(key).not.toContain("http");
      expect(key).not.toContain("//");
    });
  });
});

