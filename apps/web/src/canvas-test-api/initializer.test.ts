import { describe, expect, it } from "vitest";

import { installCanvasTestApi } from "./initializer.js";

const localConfiguration = {
  profile: "local" as const,
  apiBaseUrl: "http://localhost:4000",
  collaborationUrl: "ws://localhost:1234",
  releaseId: "test-release",
  testApiEnabled: true,
};

describe("CanvasTestApi installation", () => {
  it("installs a frozen, non-writable, non-configurable global", () => {
    installCanvasTestApi(localConfiguration);

    const descriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "__CANVAS_TEST_API__",
    );

    expect(descriptor).toBeDefined();
    expect(descriptor!.writable).toBe(false);
    expect(descriptor!.configurable).toBe(false);
  });

  it("has only the inspect method", () => {
    const api = (globalThis as Record<string, unknown>)[
      "__CANVAS_TEST_API__"
    ] as { inspect: () => unknown };
    const ownKeys = Object.keys(api);
    expect(ownKeys).toEqual(["inspect"]);
  });

  it("returns the exact foundation snapshot", () => {
    const api = (globalThis as Record<string, unknown>)[
      "__CANVAS_TEST_API__"
    ] as { inspect: () => unknown };
    const snapshot = api.inspect();

    expect(snapshot).toEqual({
      schemaVersion: 1,
      runtime: {
        profile: "local",
        releaseId: "test-release",
      },
      canvas: { status: "not-mounted" },
      room: null,
      scene: null,
      collaboration: { status: "disconnected" },
      persistence: { status: "not-configured" },
    });
  });

  it("returns a frozen snapshot each call", () => {
    const api = (globalThis as Record<string, unknown>)[
      "__CANVAS_TEST_API__"
    ] as { inspect: () => object };

    const first = api.inspect();
    const second = api.inspect();

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(second)).toBe(true);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("is JSON-serializable", () => {
    const api = (globalThis as Record<string, unknown>)[
      "__CANVAS_TEST_API__"
    ] as { inspect: () => Record<string, unknown> };
    const snapshot = api.inspect();
    const json = JSON.stringify(snapshot);
    const parsed = JSON.parse(json) as Record<string, unknown>;

    expect(parsed).toEqual({
      schemaVersion: 1,
      runtime: {
        profile: "local",
        releaseId: "test-release",
      },
      canvas: { status: "not-mounted" },
      room: null,
      scene: null,
      collaboration: { status: "disconnected" },
      persistence: { status: "not-configured" },
    });
  });

  it("has no forbidden fields", () => {
    const api = (globalThis as Record<string, unknown>)[
      "__CANVAS_TEST_API__"
    ] as { inspect: () => Record<string, unknown> };
    const snapshot = api.inspect();

    const snapshotKeys = Object.keys(snapshot);
    expect(snapshotKeys).not.toContain("token");
    expect(snapshotKeys).not.toContain("email");
    expect(snapshotKeys).not.toContain("identity");
    expect(snapshotKeys).not.toContain("url");
    expect(snapshotKeys).not.toContain("binary");
    expect(snapshotKeys).not.toContain("recoveryContent");

    const apiKeys = Object.keys(api);
    expect(apiKeys).not.toContain("set");
    expect(apiKeys).not.toContain("mutate");
    expect(apiKeys).not.toContain("command");
    expect(apiKeys).not.toContain("update");
  });
});
