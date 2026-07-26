import { describe, expect, it } from "vitest";

import { parseApiConfiguration } from "./api.js";
import { parseCollaborationConfiguration } from "./collaboration.js";
import { ConfigurationError } from "./common.js";
import { parseWebConfiguration } from "./web.js";

describe("configuration contracts", () => {
  it("uses bounded local defaults", () => {
    expect(parseWebConfiguration({})).toEqual({
      profile: "local",
      apiBaseUrl: "http://localhost:4000",
      collaborationUrl: "ws://localhost:1234",
      releaseId: "local-dev",
    });
    expect(parseApiConfiguration({})).toMatchObject({
      profile: "local",
      host: "127.0.0.1",
      port: 4000,
      allowedWebOrigins: ["http://localhost:5173"],
    });
    expect(parseCollaborationConfiguration({})).toMatchObject({
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
    expect(() =>
      parseApiConfiguration({
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        ALLOWED_WEB_ORIGINS: "*",
        RELEASE_ID: "production-1",
      }),
    ).toThrow(ConfigurationError);

    expect(() =>
      parseApiConfiguration({
        APP_PROFILE: "production",
        API_HOST: "0.0.0.0",
        API_PORT: "4000",
        ALLOWED_WEB_ORIGINS: "http://canvas.example.test",
        RELEASE_ID: "production-1",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects invalid ports", () => {
    expect(() => parseApiConfiguration({ API_PORT: "65536" })).toThrow(
      ConfigurationError,
    );
    expect(() => parseApiConfiguration({ API_PORT: "4e3" })).toThrow(
      ConfigurationError,
    );
  });

  it("rejects unsupported Excalidraw versions", () => {
    expect(() =>
      parseCollaborationConfiguration({
        SUPPORTED_EXCALIDRAW_VERSION: "0.18.0",
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
});
