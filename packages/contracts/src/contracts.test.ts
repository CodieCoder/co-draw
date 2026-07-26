import { describe, expect, it } from "vitest";

import {
  API_ERROR_CODES,
  COLLABORATION_ERROR_CODES,
  apiErrorResponseSchema,
} from "./errors.js";
import {
  HEALTH_DEPENDENCY_VALUES,
  HEALTH_ERROR_CODES,
  createFoundationNotReady,
  createLiveness,
  createNotReady,
  createReady,
  readinessSchema,
} from "./health.js";
import { ROLE_VALUES, roleSchema } from "./roles.js";

describe("role contracts", () => {
  it("accepts only the accepted role registry", () => {
    expect(ROLE_VALUES).toEqual(["owner", "editor", "viewer"]);
    expect(roleSchema.parse("editor")).toBe("editor");
    expect(roleSchema.safeParse("admin").success).toBe(false);
  });
});

describe("error contracts", () => {
  it("keeps the accepted registries exact", () => {
    expect(API_ERROR_CODES).toEqual([
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
    ]);
    expect(COLLABORATION_ERROR_CODES).toEqual([
      "COLLAB_SESSION_INVALID",
      "COLLAB_ROOM_NOT_FOUND",
      "COLLAB_ROOM_ARCHIVED",
      "COLLAB_PERMISSION_DENIED",
      "COLLAB_DOCUMENT_LOAD_FAILED",
      "COLLAB_DOCUMENT_INVALID",
      "COLLAB_PERSISTENCE_FAILED",
      "COLLAB_VERSION_UNSUPPORTED",
      "COLLAB_PHYSICS_LEASE_DENIED",
    ]);
  });

  it("accepts bounded validation details and rejects unknown fields", () => {
    const response = {
      error: {
        code: "VALIDATION_FAILED",
        message: "Some fields are invalid.",
        requestId: "req_01K_SAFE",
        details: {
          fields: [
            {
              field: "username",
              code: "TOO_SHORT",
              message: "Username is too short.",
            },
          ],
        },
      },
    };

    expect(apiErrorResponseSchema.parse(response)).toEqual(response);
    expect(
      apiErrorResponseSchema.safeParse({
        ...response,
        privateIdentity: "forbidden",
      }).success,
    ).toBe(false);
  });

  it("rejects arbitrary details on non-validation errors", () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: {
          code: "INTERNAL_ERROR",
          message: "The request could not be completed.",
          requestId: "req_safe",
          details: { stack: "forbidden" },
        },
      }).success,
    ).toBe(false);
  });
});

describe("health contracts", () => {
  it("creates strict liveness and deliberately not-ready results", () => {
    expect(createLiveness("api", "test")).toEqual({
      service: "api",
      state: "live",
      releaseId: "test",
    });
    expect(createFoundationNotReady("collaboration", "test")).toEqual({
      service: "collaboration",
      state: "not_ready",
      releaseId: "test",
      dependency: "foundation",
      code: "FOUNDATION_INCOMPLETE",
    });
    expect(
      readinessSchema.parse({
        service: "api",
        state: "ready",
        releaseId: "test",
      }),
    ).toEqual({
      service: "api",
      state: "ready",
      releaseId: "test",
    });
    expect(
      readinessSchema.safeParse({
        service: "api",
        state: "degraded",
        releaseId: "test",
      }).success,
    ).toBe(false);
  });

  it("creates strict ready results", () => {
    expect(createReady("api", "test")).toEqual({
      service: "api",
      state: "ready",
      releaseId: "test",
    });
  });

  it("creates dependency-specific not-ready results", () => {
    expect(createNotReady("api", "test", "database", "DATABASE_UNAVAILABLE")).toEqual({
      service: "api",
      state: "not_ready",
      releaseId: "test",
      dependency: "database",
      code: "DATABASE_UNAVAILABLE",
    });

    expect(
      createNotReady("collaboration", "test", "schema", "SCHEMA_UNSUPPORTED"),
    ).toEqual({
      service: "collaboration",
      state: "not_ready",
      releaseId: "test",
      dependency: "schema",
      code: "SCHEMA_UNSUPPORTED",
    });

    expect(
      createNotReady("api", "test", "object_storage", "OBJECT_STORAGE_UNAVAILABLE"),
    ).toEqual({
      service: "api",
      state: "not_ready",
      releaseId: "test",
      dependency: "object_storage",
      code: "OBJECT_STORAGE_UNAVAILABLE",
    });

    expect(
      createNotReady(
        "collaboration",
        "test",
        "persistence",
        "PERSISTENCE_UNAVAILABLE",
      ),
    ).toEqual({
      service: "collaboration",
      state: "not_ready",
      releaseId: "test",
      dependency: "persistence",
      code: "PERSISTENCE_UNAVAILABLE",
    });
  });

  it("prevents mismatched dependency/code combinations", () => {
    // Runtime guard prevents invalid combinations even when types align.
    expect(() =>
      createNotReady("api", "test", "database", "FOUNDATION_INCOMPLETE"),
    ).toThrow();
  });

  it("rejects raw diagnostic fields", () => {
    expect(
      readinessSchema.safeParse({
        ...createFoundationNotReady("api", "test"),
        host: "private-host",
      }).success,
    ).toBe(false);
    expect(HEALTH_DEPENDENCY_VALUES).toContain("foundation");
    expect(HEALTH_ERROR_CODES).toContain("FOUNDATION_INCOMPLETE");
  });
});
