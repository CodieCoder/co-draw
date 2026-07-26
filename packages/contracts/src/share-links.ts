import { z } from "zod";

export const SHARE_LINK_TOKEN_BYTES = 32;

export const CreateShareLinkRequestSchema = z.object({
  defaultRole: z.literal("editor"),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().min(0).optional(),
});

export type CreateShareLinkRequest = z.infer<typeof CreateShareLinkRequestSchema>;

export const CreateShareLinkResponseSchema = z.object({
  shareLink: z.object({
    id: z.string().uuid(),
    url: z.string(),
    defaultRole: z.literal("editor"),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().min(0).optional(),
    createdAt: z.string().datetime(),
  }),
});

export type CreateShareLinkResponse = z.infer<typeof CreateShareLinkResponseSchema>;

export const ResolveShareLinkResponseSchema = z.object({
  room: z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: z.enum(["active", "archived"]),
  }),
  invitation: z.object({
    defaultRole: z.enum(["editor", "viewer"]),
    requiresGuestSession: z.boolean(),
  }),
});

export type ResolveShareLinkResponse = z.infer<typeof ResolveShareLinkResponseSchema>;

export const AcceptShareLinkResponseSchema = z.object({
  room: z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: z.enum(["active", "archived"]),
  }),
  membership: z.object({
    role: z.enum(["editor", "viewer"]),
  }),
});

export type AcceptShareLinkResponse = z.infer<typeof AcceptShareLinkResponseSchema>;
