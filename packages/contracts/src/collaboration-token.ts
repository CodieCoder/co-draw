import { z } from "zod";

export const COLLABORATION_TOKEN_VERSION = 1;
export const COLLABORATION_TOKEN_LIFETIME_MS = 5 * 60 * 1000;

export const CollaborationAccessClaimsSchema = z.object({
  version: z.literal(COLLABORATION_TOKEN_VERSION),
  sessionId: z.string().uuid(),
  guestId: z.string().uuid(),
  roomId: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
  mode: z.enum(["read-write", "read-only"]),
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

export type CollaborationAccessClaims = z.infer<typeof CollaborationAccessClaimsSchema>;

export const CollaborationBootstrapResponseSchema = z.object({
  room: z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "archived"]),
  }),
  guest: z.object({
    id: z.string().uuid(),
    username: z.string(),
    colour: z.string(),
  }),
  access: z.object({
    role: z.enum(["owner", "editor", "viewer"]),
    mode: z.enum(["read-write", "read-only"]),
  }),
  collaboration: z.object({
    documentName: z.string(),
    websocketUrl: z.string(),
    accessToken: z.string(),
    expiresAt: z.string().datetime(),
    schemaVersion: z.number().int().positive(),
  }),
});

export type CollaborationBootstrapResponse = z.infer<typeof CollaborationBootstrapResponseSchema>;

export function documentNameForRoom(roomId: string): string {
  return `room:${roomId}`;
}

export function collaborationModeForRole(role: string): "read-write" | "read-only" {
  return role === "viewer" ? "read-only" : "read-write";
}
