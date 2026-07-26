import {
  expect,
  test,
} from "@playwright/test";

import type { CanvasTestApi } from "../../apps/web/src/canvas-test-api/types.js";

const requiredEnvironment = (field: string): string => {
  const value = process.env[field];
  if (value === undefined || value === "") {
    throw new Error(`Required browser field ${field} is missing.`);
  }
  return value;
};

const snapshotSchema = {
  schemaVersion: 1,
  runtime: {
    profile: "local",
    releaseId: expect.any(String),
  },
  canvas: { status: "not-mounted" },
  room: null,
  scene: null,
  collaboration: { status: "disconnected" },
  persistence: { status: "not-configured" },
};

test("canvas test API presence matches phase expectation", async ({ page }) => {
  const baseUrl = requiredEnvironment("VEGA_TEST_WEB_BASE_URL");
  const expectPresent =
    requiredEnvironment("VEGA_TEST_EXPECT_API_PRESENT") === "true";

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(`${baseUrl}/guest`);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Create a private guest identity",
    }),
  ).toBeVisible();

  const hasApi: boolean = await page.evaluate(() =>
    typeof (window as unknown as Record<string, unknown>).__CANVAS_TEST_API__ !== "undefined",
  );

  if (expectPresent) {
    expect(hasApi).toBe(true);

    const snapshot: Record<string, unknown> = await page.evaluate(() => {
      const api = (window as unknown as Record<string, unknown>).__CANVAS_TEST_API__ as CanvasTestApi;
      return { ...api.inspect() };
    });

    expect(snapshot).toMatchObject(snapshotSchema);
    expect(snapshot.schemaVersion as number).toBe(1);

    const frozen: boolean = await page.evaluate(() => {
      const api = (window as unknown as Record<string, unknown>).__CANVAS_TEST_API__ as CanvasTestApi;
      return Object.isFrozen(api.inspect());
    });
    expect(frozen).toBe(true);

    const apiKeys: string[] = await page.evaluate(() => {
      const api = (window as unknown as Record<string, unknown>).__CANVAS_TEST_API__ as CanvasTestApi;
      return Object.keys(api);
    });
    expect(apiKeys).toEqual(["inspect"]);

    const apiDescriptor: { writable: boolean; configurable: boolean } =
      await page.evaluate(() => {
        const descriptor = Object.getOwnPropertyDescriptor(
          window,
          "__CANVAS_TEST_API__",
        );
        return {
          writable: descriptor!.writable as boolean,
          configurable: descriptor!.configurable as boolean,
        };
      });
    expect(apiDescriptor.writable).toBe(false);
    expect(apiDescriptor.configurable).toBe(false);

    await expect.poll(() => consoleErrors).toEqual([]);
  } else {
    expect(hasApi).toBe(false);
  }
});
