import { describe, expect, it } from "vitest";

import { parseApiConfiguration } from "./api.js";
import { parseCollaborationConfiguration } from "./collaboration.js";
import { ConfigurationError } from "./common.js";
import { parseWebConfiguration } from "./web.js";

const apiEnv = {
  API_DATABASE_URL: "postgresql://api-user:secret@localhost:5432/vega",
  OBJECT_STORAGE_ENDPOINT: "http://localhost:9000",
  OBJECT_STORAGE_REGION: "us-east-1",
  OBJECT_STORAGE_BUCKET: "vega-canvas-local",
  OBJECT_STORAGE_ACCESS_KEY: "minio-access",
  OBJECT_STORAGE_SECRET_KEY: "minio-secret",
  OBJECT_STORAGE_FORCE_PATH_STYLE: "true",
};

const collabEnv = {
  COLLABORATION_DATABASE_URL:
    "postgresql://collab-user:secret@localhost:5432/vega",
};

describe("configuration contracts", () => {
  it("uses bounded local defaults", () => {
    expect(parseWebConfiguration({})).toEqual({
      profile: "local",
      apiBaseUrl: "http://localhost:4000",
      collaborationUrl: "ws://localhost:1234",
      releaseId: "local-dev",
    });
    expect(parseApiConfiguration(apiEnv)).toMatchObject({
      profile: "local",
      host: "127.0.0.1",
      port: 4000,
      allowedWebOrigins: ["http://localhost:5173"],
      objectStorageRegion: "us-east-1",
      objectStorageForcePathStyle: true,
    });
    expect(
      parseCollaborationConfiguration({
        ...collabEnv,
        SUPPORTED_EXCALIDRAW_VERSION: "0.18.1",
      }),
    ).toMatchObject({
      port: 1234,
      supportedExcalidrawVersion: "0.18.1",
    });
  });

  it("requires secure public transports outside local development", () => {
    expect(() =>
      parseWebConfiguration({
        VITE_APP_PROFILE: "demo",
        VITE_API_BASE_URL: "http://api.example.test",
        VITE_COLLABORATION_URL: "wss://collab.example.test",
        VITE_RELEASE_ID: "demo-1",
      }),
    ).toThrow(ConfigurationError);
  });

  it("requires explicit public settings outside local development", () => {
    expect(() =>
      parseWebConfiguration({
        VITE_APP_PROFILE: "production",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects wildcard and insecure credentialed origins", () => {
    // Use valid production database and storage values alongside the origin test.
    const productionEnv = {
      API_DATABASE_URL:
        "postgresql://api-user:secret@db.example.com:5432/vega?sslmode=require",
      OBJECT_STORAGE_ENDPOINT: "https://s3.example.com",
      OBJECT_STORAGE_BUCKET: "vega-prod",
      OBJECT_STORAGE_ACCESS_KEY: "prod-key",
      OBJECT_STORAGE_SECRET_KEY: "prod-secret",
      OBJECT_STORAGE_FORCE_PATH_STYLE: "false",
    };

    expect(() =>
      parseApiConfiguration({
        ...productionEnv,
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        ALLOWED_WEB_ORIGINS: "*",
        RELEASE_ID: "production-1",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...productionEnv,
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        ALLOWED_WEB_ORIGINS: "http://canvas.example.test",
        RELEASE_ID: "production-1",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects invalid ports", () => {
    expect(() =>
      parseApiConfiguration({ ...apiEnv, API_PORT: "65536" }),
    ).toThrow(ConfigurationError);
    expect(() =>
      parseApiConfiguration({ ...apiEnv, API_PORT: "4e3" }),
    ).toThrow(ConfigurationError);
  });

  it("rejects unsupported Excalidraw versions", () => {
    expect(() =>
      parseCollaborationConfiguration({
        ...collabEnv,
        SUPPORTED_EXCALIDRAW_VERSION: "0.18.0",
      }),
    ).toThrow(ConfigurationError);
  });

  it("requires database and storage fields for server configs", () => {
    expect(() => parseApiConfiguration({})).toThrow(ConfigurationError);

    try {
      parseApiConfiguration({});
      throw new Error("Expected parsing to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConfigurationError);
      const issues = (error as ConfigurationError).issues;
      expect(issues.some((i) => i.path === "API_DATABASE_URL")).toBe(true);
    }

    expect(() => parseCollaborationConfiguration({})).toThrow(
      ConfigurationError,
    );
  });

  it("parses boolean values for storage path style", () => {
    // Default (no value) → true
    const { OBJECT_STORAGE_FORCE_PATH_STYLE: _, ...envWithoutBool } = apiEnv;
    expect(
      parseApiConfiguration(envWithoutBool).objectStorageForcePathStyle,
    ).toBe(true);

    expect(
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_FORCE_PATH_STYLE: "false",
      }).objectStorageForcePathStyle,
    ).toBe(false);

    expect(
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_FORCE_PATH_STYLE: "0",
      }).objectStorageForcePathStyle,
    ).toBe(false);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_FORCE_PATH_STYLE: "invalid",
      }),
    ).toThrow(ConfigurationError);
  });

  it("reports only redacted field paths and stable codes", () => {
    const rejectedSecret = "https://user:private-value@example.test";

    try {
      parseWebConfiguration({
        VITE_API_BASE_URL: rejectedSecret,
      });
      throw new Error("Expected parsing to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConfigurationError);
      const safeError = error as ConfigurationError;
      expect(safeError.issues).toEqual([
        { path: "VITE_API_BASE_URL", code: "INVALID_FORMAT" },
      ]);
      expect(JSON.stringify(safeError)).not.toContain(rejectedSecret);
      expect(safeError.message).not.toContain("private-value");
    }
  });

  // -----------------------------------------------------------------------
  // Specialized validator tests (Stage 0B review remediation)
  // -----------------------------------------------------------------------

  it("rejects CHANGE_ME placeholders in credentials", () => {
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_ACCESS_KEY: "CHANGE_ME",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_SECRET_KEY: "CHANGE_ME",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_BUCKET: "CHANGE_ME",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        API_DATABASE_URL: "postgresql://CHANGE_ME:CHANGE_ME@localhost:5432/CHANGE_ME",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects invalid PostgreSQL URL formats", () => {
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        API_DATABASE_URL: "http://not-postgres.example.com",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        API_DATABASE_URL: "postgresql://:@localhost:5432/db",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        API_DATABASE_URL: "postgresql://api:secret@localhost:5432",
      }),
    ).toThrow(ConfigurationError);
  });

  it("requires TLS for non-local PostgreSQL URLs", () => {
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        RELEASE_ID: "production-1",
        ALLOWED_WEB_ORIGINS: "https://canvas.example.test",
        OBJECT_STORAGE_ENDPOINT: "https://s3.example.com",
        OBJECT_STORAGE_BUCKET: "vega-prod",
        OBJECT_STORAGE_ACCESS_KEY: "prod-key",
        OBJECT_STORAGE_SECRET_KEY: "prod-secret",
      }),
    ).toThrow(ConfigurationError);

    // Valid production config with TLS should succeed.
    expect(() =>
      parseApiConfiguration({
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        RELEASE_ID: "production-1",
        ALLOWED_WEB_ORIGINS: "https://canvas.example.test",
        API_DATABASE_URL:
          "postgresql://api-user:secret@db.example.com:5432/vega?sslmode=require",
        OBJECT_STORAGE_ENDPOINT: "https://s3.example.com",
        OBJECT_STORAGE_REGION: "us-east-1",
        OBJECT_STORAGE_BUCKET: "vega-prod",
        OBJECT_STORAGE_ACCESS_KEY: "prod-key",
        OBJECT_STORAGE_SECRET_KEY: "prod-secret",
        OBJECT_STORAGE_FORCE_PATH_STYLE: "false",
      }),
    ).not.toThrow();
  });

  it("requires HTTPS for non-local S3 endpoints", () => {
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        RELEASE_ID: "production-1",
        ALLOWED_WEB_ORIGINS: "https://canvas.example.test",
        API_DATABASE_URL:
          "postgresql://api-user:secret@db.example.com:5432/vega?sslmode=require",
        OBJECT_STORAGE_BUCKET: "vega-prod",
        OBJECT_STORAGE_ACCESS_KEY: "prod-key",
        OBJECT_STORAGE_SECRET_KEY: "prod-secret",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects invalid bucket names", () => {
    // Too short (< 3 chars).
    expect(() =>
      parseApiConfiguration({ ...apiEnv, OBJECT_STORAGE_BUCKET: "ab" }),
    ).toThrow(ConfigurationError);

    // Too long (> 63 chars).
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_BUCKET: "a".repeat(64),
      }),
    ).toThrow(ConfigurationError);

    // IP address format.
    expect(() =>
      parseApiConfiguration({ ...apiEnv, OBJECT_STORAGE_BUCKET: "192.168.0.1" }),
    ).toThrow(ConfigurationError);

    // Uppercase letters.
    expect(() =>
      parseApiConfiguration({ ...apiEnv, OBJECT_STORAGE_BUCKET: "Invalid-Bucket" }),
    ).toThrow(ConfigurationError);

    // Starts with hyphen.
    expect(() =>
      parseApiConfiguration({ ...apiEnv, OBJECT_STORAGE_BUCKET: "-invalid" }),
    ).toThrow(ConfigurationError);

    for (const bucket of [
      "invalid..bucket",
      "invalid.-bucket",
      "xn--reserved",
      "reserved--x-s3",
    ]) {
      expect(() =>
        parseApiConfiguration({
          ...apiEnv,
          OBJECT_STORAGE_BUCKET: bucket,
        }),
      ).toThrow(ConfigurationError);
    }
  });

  it("reports PLACEHOLDER_DETECTED code for placeholder values", () => {
    try {
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_ACCESS_KEY: "CHANGE_ME",
      });
      throw new Error("Expected parsing to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConfigurationError);
      const safeError = error as ConfigurationError;
      expect(safeError.issues.some((i) => i.code === "PLACEHOLDER_DETECTED")).toBe(true);
      expect(safeError.message).not.toContain("CHANGE_ME");
    }
  });

  it("rejects S3 endpoints with embedded credentials", () => {
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_ENDPOINT: "http://user:pass@localhost:9000",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_ENDPOINT: "http://localhost:9000/path",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects malformed storage regions", () => {
    expect(() =>
      parseApiConfiguration({
        ...apiEnv,
        OBJECT_STORAGE_REGION: "US East 1",
      }),
    ).toThrow(ConfigurationError);
  });
});
