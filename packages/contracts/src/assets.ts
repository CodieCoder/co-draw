import { z } from "zod";

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_ASSET_FILENAME_LENGTH = 255;

export const ImageMimeTypeSchema = z.enum(IMAGE_MIME_TYPES);

export const CreateAssetRequestSchema = z
  .object({
    kind: z.literal("image"),
    mimeType: ImageMimeTypeSchema,
    sizeBytes: z.number().int().positive().max(MAX_IMAGE_SIZE_BYTES),
    originalFilename: z
      .string()
      .trim()
      .min(1)
      .max(MAX_ASSET_FILENAME_LENGTH)
      .optional(),
  })
  .strict();

export const UploadAssetContentRequestSchema = z
  .object({
    dataUrl: z
      .string()
      .min(1)
      .max(Math.ceil((MAX_IMAGE_SIZE_BYTES * 4) / 3) + 128),
  })
  .strict();

export const AssetStatusSchema = z.enum([
  "pending",
  "uploading",
  "ready",
  "failed",
]);

export const AssetResponseSchema = z
  .object({
    asset: z
      .object({
        id: z.string().uuid(),
        kind: z.literal("image"),
        status: AssetStatusSchema,
        mimeType: ImageMimeTypeSchema,
        sizeBytes: z.number().int().positive().max(MAX_IMAGE_SIZE_BYTES),
        readyAt: z.string().datetime().optional(),
      })
      .strict(),
  })
  .strict();

export const CreateAssetResponseSchema = AssetResponseSchema.extend({
  upload: z
    .object({
      method: z.literal("API_PROXY"),
      endpoint: z.string().startsWith("/api/v1/"),
    })
    .strict(),
});

export type ImageMimeType = z.infer<typeof ImageMimeTypeSchema>;
export type CreateAssetRequest = z.infer<typeof CreateAssetRequestSchema>;
export type AssetResponse = z.infer<typeof AssetResponseSchema>;
export type CreateAssetResponse = z.infer<typeof CreateAssetResponseSchema>;

