import { z } from "zod";

export const SERVICE_VALUES = ["api", "collaboration"] as const;
export const HEALTH_DEPENDENCY_VALUES = [
  "configuration",
  "database",
  "object_storage",
  "authentication",
  "authorization",
  "persistence",
  "schema",
  "collaboration_control",
  "foundation",
] as const;
export const HEALTH_ERROR_CODES = [
  "CONFIGURATION_INVALID",
  "DATABASE_UNAVAILABLE",
  "OBJECT_STORAGE_UNAVAILABLE",
  "AUTHENTICATION_UNAVAILABLE",
  "AUTHORIZATION_UNAVAILABLE",
  "PERSISTENCE_UNAVAILABLE",
  "SCHEMA_UNSUPPORTED",
  "COLLABORATION_CONTROL_UNAVAILABLE",
  "FOUNDATION_INCOMPLETE",
] as const;

const serviceSchema = z.enum(SERVICE_VALUES);
const releaseIdSchema = z.string().min(1).max(128);

export const livenessSchema = z
  .object({
    service: serviceSchema,
    state: z.literal("live"),
    releaseId: releaseIdSchema,
  })
  .strict();

export const readyHealthSchema = z
  .object({
    service: serviceSchema,
    state: z.literal("ready"),
    releaseId: releaseIdSchema,
  })
  .strict();

export const notReadyHealthSchema = z
  .object({
    service: serviceSchema,
    state: z.literal("not_ready"),
    releaseId: releaseIdSchema,
    dependency: z.enum(HEALTH_DEPENDENCY_VALUES),
    code: z.enum(HEALTH_ERROR_CODES),
  })
  .strict();

export const readinessSchema = z.discriminatedUnion("state", [
  readyHealthSchema,
  notReadyHealthSchema,
]);

export type ServiceName = z.infer<typeof serviceSchema>;
export type Liveness = z.infer<typeof livenessSchema>;
export type Readiness = z.infer<typeof readinessSchema>;

export const createLiveness = (
  service: ServiceName,
  releaseId: string,
): Liveness => livenessSchema.parse({ service, state: "live", releaseId });

export type HealthDependency = (typeof HEALTH_DEPENDENCY_VALUES)[number];
export type HealthErrorCode = (typeof HEALTH_ERROR_CODES)[number];

const DEPENDENCY_CODE_MAP: Readonly<Record<HealthDependency, HealthErrorCode>> = {
  configuration: "CONFIGURATION_INVALID",
  database: "DATABASE_UNAVAILABLE",
  object_storage: "OBJECT_STORAGE_UNAVAILABLE",
  authentication: "AUTHENTICATION_UNAVAILABLE",
  authorization: "AUTHORIZATION_UNAVAILABLE",
  persistence: "PERSISTENCE_UNAVAILABLE",
  schema: "SCHEMA_UNSUPPORTED",
  collaboration_control: "COLLABORATION_CONTROL_UNAVAILABLE",
  foundation: "FOUNDATION_INCOMPLETE",
};

export const createReady = (
  service: ServiceName,
  releaseId: string,
): Readiness =>
  readinessSchema.parse({ service, state: "ready", releaseId });

export const createNotReady = (
  service: ServiceName,
  releaseId: string,
  dependency: HealthDependency,
  code: HealthErrorCode,
): Readiness => {
  const expected = DEPENDENCY_CODE_MAP[dependency];
  if (expected === undefined) {
    throw new Error(`Unknown health dependency: ${dependency}`);
  }
  if (code !== expected) {
    throw new Error(
      `Mismatched dependency "${dependency}" and code "${code}". Expected "${expected}".`,
    );
  }
  return readinessSchema.parse({
    service,
    state: "not_ready",
    releaseId,
    dependency,
    code,
  });
};

export const createFoundationNotReady = (
  service: ServiceName,
  releaseId: string,
): Readiness =>
  createNotReady(service, releaseId, "foundation", "FOUNDATION_INCOMPLETE");
