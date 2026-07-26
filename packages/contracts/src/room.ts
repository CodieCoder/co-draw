import { z } from "zod";

export const RoomStatusSchema = z.enum(["active", "archived"]);

export type RoomStatus = z.infer<typeof RoomStatusSchema>;

export const CapabilitiesSchema = z.object({
  canView: z.boolean(),
  canEdit: z.boolean(),
  canUploadAssets: z.boolean(),
  canManageMembers: z.boolean(),
  canArchive: z.boolean(),
  canRestore: z.boolean(),
  canExport: z.boolean(),
  canUsePhysics: z.boolean(),
});

export type RoomCapabilities = z.infer<typeof CapabilitiesSchema>;

export const CreateRoomRequestSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
});

export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const RoomMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: RoomStatusSchema,
  createdAt: z.string().datetime(),
});

export type RoomMetadata = z.infer<typeof RoomMetadataSchema>;

export const CreateRoomResponseSchema = z.object({
  room: RoomMetadataSchema.extend({
    role: z.literal("owner"),
  }),
});

export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

export const MembershipInfoSchema = z.object({
  guestId: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
});

export type MembershipInfo = z.infer<typeof MembershipInfoSchema>;

export const GetRoomResponseSchema = z.object({
  room: RoomMetadataSchema.extend({
    updatedAt: z.string().datetime(),
    archivedAt: z.string().datetime().optional(),
  }),
  membership: MembershipInfoSchema,
  capabilities: CapabilitiesSchema,
});

export type GetRoomResponse = z.infer<typeof GetRoomResponseSchema>;

export function deriveCapabilities(role: "owner" | "editor" | "viewer"): RoomCapabilities {
  return {
    canView: true,
    canEdit: role === "owner" || role === "editor",
    canUploadAssets: role === "owner" || role === "editor",
    canManageMembers: role === "owner",
    canArchive: role === "owner",
    canRestore: role === "owner",
    canExport: role === "owner",
    canUsePhysics: false,
  };
}
