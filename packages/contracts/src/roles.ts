import { z } from "zod";

export const ROLE_VALUES = ["owner", "editor", "viewer"] as const;
export const roleSchema = z.enum(ROLE_VALUES);

export type Role = z.infer<typeof roleSchema>;
