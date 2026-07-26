import { describe, expect, it } from "vitest";

import { mapDatabaseReadiness } from "./health.js";

describe("collaboration database health mapping", () => {
  it("maps ready, connectivity, and schema states exactly", () => {
    expect(mapDatabaseReadiness("release", { ready: true })).toEqual({
      status: 200,
      body: {
        service: "collaboration",
        state: "ready",
        releaseId: "release",
      },
    });
    expect(
      mapDatabaseReadiness("release", {
        ready: false,
        reason: "connectivity",
      }),
    ).toEqual({
      status: 503,
      body: {
        service: "collaboration",
        state: "not_ready",
        releaseId: "release",
        dependency: "database",
        code: "DATABASE_UNAVAILABLE",
      },
    });
    expect(
      mapDatabaseReadiness("release", {
        ready: false,
        reason: "unsupported_schema",
      }),
    ).toEqual({
      status: 503,
      body: {
        service: "collaboration",
        state: "not_ready",
        releaseId: "release",
        dependency: "schema",
        code: "SCHEMA_UNSUPPORTED",
      },
    });
  });
});
