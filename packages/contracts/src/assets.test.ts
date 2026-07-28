import { describe, expect, it } from "vitest";

import {
  AssetResponseSchema,
  CreateAssetRequestSchema,
  MAX_IMAGE_SIZE_BYTES,
  UploadAssetContentRequestSchema,
} from "./assets.js";

describe("asset contracts", () => {
  it("accepts the bounded private image request", () => {
    expect(
      CreateAssetRequestSchema.parse({
        kind: "image",
        mimeType: "image/png",
        sizeBytes: 512,
        originalFilename: "diagram.png",
      }),
    ).toEqual({
      kind: "image",
      mimeType: "image/png",
      sizeBytes: 512,
      originalFilename: "diagram.png",
    });
  });

  it("rejects unsupported or excessive image requests", () => {
    expect(
      CreateAssetRequestSchema.safeParse({
        kind: "image",
        mimeType: "image/svg+xml",
        sizeBytes: 512,
      }).success,
    ).toBe(false);
    expect(
      CreateAssetRequestSchema.safeParse({
        kind: "image",
        mimeType: "image/png",
        sizeBytes: MAX_IMAGE_SIZE_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it("bounds encoded upload bodies and ready metadata", () => {
    expect(
      UploadAssetContentRequestSchema.safeParse({ dataUrl: "" }).success,
    ).toBe(false);
    expect(
      AssetResponseSchema.safeParse({
        asset: {
          id: "01933a4f-2a00-7000-8000-000000000001",
          kind: "image",
          status: "ready",
          mimeType: "image/webp",
          sizeBytes: 128,
          readyAt: "2026-07-26T12:00:00.000Z",
        },
      }).success,
    ).toBe(true);
  });
});

