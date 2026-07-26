import { z } from "zod";

export const API_ERROR_CODES = [
  "VALIDATION_FAILED",
  "SESSION_INVALID",
  "SESSION_EXPIRED",
  "SESSION_REVOKED",
  "ROOM_NOT_FOUND",
  "ROOM_ARCHIVED",
  "ROOM_ALREADY_ACTIVE",
  "PERMISSION_DENIED",
  "MEMBERSHIP_NOT_FOUND",
  "LAST_OWNER_REQUIRED",
  "SHARE_LINK_INVALID",
  "SHARE_LINK_EXPIRED",
  "SHARE_LINK_REVOKED",
  "SHARE_LINK_USE_LIMIT_REACHED",
  "ASSET_NOT_FOUND",
  "ASSET_TYPE_UNSUPPORTED",
  "ASSET_TOO_LARGE",
  "ASSET_STATE_INVALID",
  "ASSET_UPLOAD_FAILED",
  "ASSET_ACCESS_DENIED",
  "RECYCLE_ITEM_NOT_FOUND",
  "RECYCLE_RESTORE_FAILED",
  "COLLABORATION_UNAVAILABLE",
  "COLLABORATION_ACCESS_DENIED",
  "EXPORT_FAILED",
  "DATABASE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export const COLLABORATION_ERROR_CODES = [
  "COLLAB_SESSION_INVALID",
  "COLLAB_ROOM_NOT_FOUND",
  "COLLAB_ROOM_ARCHIVED",
  "COLLAB_PERMISSION_DENIED",
  "COLLAB_DOCUMENT_LOAD_FAILED",
  "COLLAB_DOCUMENT_INVALID",
  "COLLAB_PERSISTENCE_FAILED",
  "COLLAB_VERSION_UNSUPPORTED",
  "COLLAB_PHYSICS_LEASE_DENIED",
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export const collaborationErrorCodeSchema = z.enum(COLLABORATION_ERROR_CODES);

const safeRequestIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/u);

export const validationFieldErrorSchema = z
  .object({
    field: z.string().min(1).max(128),
    code: z.string().min(1).max(64).regex(/^[A-Z0-9_]+$/u),
    message: z.string().min(1).max(256),
  })
  .strict();

export const validationErrorDetailsSchema = z
  .object({
    fields: z.array(validationFieldErrorSchema).min(1).max(50),
  })
  .strict();

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: apiErrorCodeSchema,
        message: z.string().min(1).max(512),
        requestId: safeRequestIdSchema,
        details: validationErrorDetailsSchema.optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasDetails = value.error.details !== undefined;
    if (hasDetails && value.error.code !== "VALIDATION_FAILED") {
      context.addIssue({
        code: "custom",
        message: "Validation details are allowed only for validation failures.",
        path: ["error", "details"],
      });
    }
  });

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type CollaborationErrorCode = z.infer<
  typeof collaborationErrorCodeSchema
>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
