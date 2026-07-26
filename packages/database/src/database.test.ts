import type pg from "pg";
import { describe, expect, it, vi } from "vitest";

import { createPool, endPool } from "./connection.js";
import { parseMigrationEnvironment } from "./migration-environment.js";
import { classifyMigrationSet } from "./migrate-status.js";
import {
  probeDatabaseReadiness,
  probePersistenceReadiness,
} from "./readiness.js";
import {
  SUPPORTED_MIGRATIONS,
  SUPPORTED_SCHEMA_VERSION,
} from "./schema-version.js";

const REQUIRED_TABLES = [
  "guests",
  "guest_sessions",
  "rooms",
  "room_memberships",
  "room_share_links",
  "collaboration_documents",
  "assets",
  "audit_events",
];

const fakePool = (
  query: (text: string) => { rows: unknown[] },
): pg.Pool => {
  const client = {
    query: vi.fn((text: string) => Promise.resolve(query(text))),
    release: vi.fn(),
  };
  return {
    connect: vi.fn(() => Promise.resolve(client)),
  } as unknown as pg.Pool;
};

describe("schema version", () => {
  it("exports the exact frozen migration registry", () => {
    expect(SUPPORTED_MIGRATIONS).toEqual([
      "001_initial-schema",
      "002_runtime-grants",
      "003_collab-select-grants",
      "004_stage-0b-corrections",
    ]);
    expect(SUPPORTED_SCHEMA_VERSION).toBe(4);
    expect(() => {
      (SUPPORTED_MIGRATIONS as string[]).push("005_extra");
    }).toThrow();
  });
});

describe("migration status", () => {
  it("classifies exact, missing, unknown, and reordered sets", () => {
    expect(classifyMigrationSet(SUPPORTED_MIGRATIONS).status).toBe(
      "up-to-date",
    );
    expect(
      classifyMigrationSet(SUPPORTED_MIGRATIONS.slice(0, -1)).status,
    ).toBe("pending");
    expect(
      classifyMigrationSet([...SUPPORTED_MIGRATIONS, "999_unknown"]).status,
    ).toBe("unsupported");
    expect(
      classifyMigrationSet([...SUPPORTED_MIGRATIONS].reverse()).status,
    ).toBe("unsupported");
  });
});

describe("migration environment", () => {
  const valid = {
    MIGRATION_DATABASE_URL:
      "postgresql://migration:secret@localhost:5433/vega",
    API_DATABASE_URL: "postgresql://api:secret@localhost:5433/vega",
    COLLABORATION_DATABASE_URL:
      "postgresql://collaboration:secret@localhost:5433/vega",
  };

  it("requires distinct roles on the same database target", () => {
    expect(parseMigrationEnvironment(valid)).toEqual({
      databaseUrl: valid.MIGRATION_DATABASE_URL,
      apiRuntimeRole: "api",
      collaborationRuntimeRole: "collaboration",
    });
    expect(() =>
      parseMigrationEnvironment({
        ...valid,
        API_DATABASE_URL: "postgresql://api:secret@localhost:5433/other",
      }),
    ).toThrow("API_DATABASE_URL");
    expect(() =>
      parseMigrationEnvironment({
        ...valid,
        API_DATABASE_URL: valid.MIGRATION_DATABASE_URL,
      }),
    ).toThrow("database roles");
  });
});

describe("connection lifecycle", () => {
  it("creates and ends a pool without connecting", async () => {
    const pool = createPool("postgresql://local:local@localhost:5432/test");
    expect(typeof pool.connect).toBe("function");
    expect(pool.listenerCount("error")).toBe(1);
    await endPool(pool);
  });
});

describe("database readiness", () => {
  it("returns connectivity not-ready instead of rejecting", async () => {
    const pool = {
      connect: vi.fn(() =>
        Promise.reject(new Error("synthetic connection detail")),
      ),
    } as unknown as pg.Pool;

    await expect(probeDatabaseReadiness(pool)).resolves.toEqual({
      ready: false,
      reason: "connectivity",
    });
  });

  it("accepts the exact schema and temporary bytea capability", async () => {
    const pool = fakePool((text) => {
      if (text.includes("FROM public.pgmigrations")) {
        return {
          rows: SUPPORTED_MIGRATIONS.map((name) => ({ name })),
        };
      }
      if (text.includes("pg_catalog.pg_class")) {
        return {
          rows: REQUIRED_TABLES.map((table_name) => ({ table_name })),
        };
      }
      if (text.includes("has_database_privilege")) {
        return {
          rows: [{ ledger_select: true, temp_allowed: true }],
        };
      }
      if (text.includes("encode(value")) {
        return {
          rows: [{ value: "766567612d72656164696e657373" }],
        };
      }
      return { rows: [] };
    });

    await expect(probeDatabaseReadiness(pool)).resolves.toEqual({
      ready: true,
    });
  });

  it("rejects a missing or unknown migration", async () => {
    const pool = fakePool((text) => {
      if (text.includes("FROM public.pgmigrations")) {
        return {
          rows: SUPPORTED_MIGRATIONS.slice(0, -1).map((name) => ({ name })),
        };
      }
      return { rows: [] };
    });

    await expect(probeDatabaseReadiness(pool)).resolves.toEqual({
      ready: false,
      reason: "unsupported_schema",
    });
  });
});

describe("collaboration persistence readiness", () => {
  it("requires all collaboration document privileges", async () => {
    const pool = fakePool(() => ({
      rows: [
        {
          can_select: true,
          can_insert: false,
          can_update: true,
          can_delete: true,
        },
      ],
    }));
    await expect(probePersistenceReadiness(pool)).resolves.toEqual({
      ready: false,
    });
  });
});
