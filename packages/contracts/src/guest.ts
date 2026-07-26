import { z } from "zod";

export const USERNAME_MIN = 2;
export const USERNAME_MAX = 40;
export const EMAIL_MAX = 254;

export const CreateGuestSessionRequestSchema = z.object({
  username: z.string().trim().min(USERNAME_MIN).max(USERNAME_MAX),
  email: z.string().trim().email().max(EMAIL_MAX).transform((e) => e.toLowerCase()),
});

export type CreateGuestSessionRequest = z.infer<typeof CreateGuestSessionRequestSchema>;

export const PublicGuestSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  colour: z.string(),
});

export type PublicGuest = z.infer<typeof PublicGuestSchema>;

export const SessionInfoSchema = z.object({
  expiresAt: z.string().datetime(),
});

export type SessionInfo = z.infer<typeof SessionInfoSchema>;

export const CreateGuestSessionResponseSchema = z.object({
  guest: PublicGuestSchema,
  session: SessionInfoSchema,
});

export type CreateGuestSessionResponse = z.infer<typeof CreateGuestSessionResponseSchema>;

export const CurrentGuestSessionResponseSchema = CreateGuestSessionResponseSchema;

export type CurrentGuestSessionResponse = z.infer<typeof CurrentGuestSessionResponseSchema>;

const SESSION_ERRORS = ["SESSION_INVALID", "SESSION_EXPIRED", "SESSION_REVOKED"] as const;

export function isSessionError(code: string): boolean {
  return (SESSION_ERRORS as readonly string[]).includes(code);
}
