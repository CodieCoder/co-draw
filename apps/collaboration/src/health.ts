import {
  createNotReady,
  createReady,
  type Readiness,
} from "@vega/contracts/health";
import type { DatabaseReadiness } from "@vega/database";

export interface HealthResponse {
  readonly status: 200 | 503;
  readonly body: Readiness;
}

export const mapDatabaseReadiness = (
  releaseId: string,
  result: DatabaseReadiness,
): HealthResponse => {
  if (result.ready) {
    return {
      status: 200,
      body: createReady("collaboration", releaseId),
    };
  }
  if (result.reason === "connectivity") {
    return {
      status: 503,
      body: createNotReady(
        "collaboration",
        releaseId,
        "database",
        "DATABASE_UNAVAILABLE",
      ),
    };
  }
  return {
    status: 503,
    body: createNotReady(
      "collaboration",
      releaseId,
      "schema",
      "SCHEMA_UNSUPPORTED",
    ),
  };
};
