import { chromium, expect } from "@playwright/test";

import { withIsolatedTestStack } from "./testing/isolated-stack.mjs";

const inspect = (page) =>
  page.evaluate(() => {
    const api = globalThis.__CANVAS_TEST_API__;
    if (!api || typeof api.inspect !== "function") {
      throw new Error("Canvas inspection API is unavailable.");
    }
    return api.inspect();
  });

const registerGuest = async (page, username, email) => {
  await page.goto("/guest");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Vega Canvas" })).toBeVisible();
};

const interactiveCanvas = (page) =>
  page.locator("canvas.excalidraw__canvas.interactive");

const drawRectangle = async (page) => {
  const canvas = interactiveCanvas(page);
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Interactive Excalidraw canvas has no bounding box.");
  }
  await page.getByTestId("toolbar-rectangle").locator("..").click();
  await page.mouse.move(box.x + 220, box.y + 180);
  await page.mouse.down();
  await page.mouse.move(box.x + 380, box.y + 300, { steps: 8 });
  await page.mouse.up();
};

const moveRectangle = async (page) => {
  const canvas = interactiveCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Interactive Excalidraw canvas has no bounding box.");
  }
  const element = (await inspect(page)).scene?.elements[0];
  if (!element) {
    throw new Error("Rectangle projection is unavailable for movement.");
  }
  const leftEdgeX = box.x + element.x;
  const middleY = box.y + element.y + element.height / 2;
  await page.getByTestId("toolbar-selection").locator("..").click();
  // Excalidraw's default rectangle is unfilled, so select its stroke rather than
  // the transparent center before moving it with keyboard input.
  await page.mouse.click(leftEdgeX, middleY);
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
};

await withIsolatedTestStack(
  { suite: "collaboration-browser" },
  async (stack) => {
    await stack.build();
    await stack.startInfrastructure();
    await stack.initializeInfrastructure();
    await stack.migrate();
    await stack.migrateStatus();
    await stack.run(
      "corepack",
      [
        "pnpm",
        "--filter",
        "@vega/web",
        "exec",
        "vite",
        "build",
        "--mode",
        "test",
      ],
      "collaboration browser web build",
      [0],
      "inherit",
      { VITE_CANVAS_TEST_API_ENABLED: "true" },
    );
    await stack.startApplications({ web: true });

    const browser = await chromium.launch();
    const aliceContext = await browser.newContext({
      baseURL: stack.webUrl,
    });
    const bobContext = await browser.newContext({
      baseURL: stack.webUrl,
    });
    const alice = await aliceContext.newPage();
    const bob = await bobContext.newPage();
    const privateValues = [
      `alice-${stack.runId}@example.test`,
      `bob-${stack.runId}@example.test`,
    ];

    try {
      await registerGuest(alice, "Alice", privateValues[0]);
      await alice.getByLabel("Room name").fill("Collaboration proof");
      await alice.getByRole("button", { name: "Create room" }).click();
      await expect(
        alice.getByTestId("connection-status"),
      ).toHaveText("Connected");

      await alice.getByRole("button", { name: "Create share link" }).click();
      const shareUrl = await alice.getByLabel("Share link").inputValue();

      await bob.goto(shareUrl);
      await expect(
        bob.getByRole("heading", {
          name: "Create a private guest identity",
        }),
      ).toBeVisible();
      await bob.getByLabel("Username").fill("Bob");
      await bob.getByLabel("Email").fill(privateValues[1]);
      await bob.getByRole("button", { name: "Continue" }).click();
      await expect(
        bob.getByRole("heading", { name: /You're invited to/u }),
      ).toBeVisible();
      await bob.getByRole("button", { name: "Accept invitation" }).click();
      await expect(bob.getByTestId("connection-status")).toHaveText(
        "Connected",
      );

      await drawRectangle(alice);
      await expect
        .poll(async () => (await inspect(alice)).scene?.elementCount)
        .toBe(1);
      await expect
        .poll(async () => (await inspect(bob)).scene?.elementCount)
        .toBe(1);

      const beforeMove = (await inspect(alice)).scene?.elements[0];
      if (!beforeMove) {
        throw new Error("Alice rectangle projection is missing.");
      }
      await moveRectangle(bob);
      await expect
        .poll(async () => {
          const aliceElement = (await inspect(alice)).scene?.elements[0];
          const bobElement = (await inspect(bob)).scene?.elements[0];
          if (!aliceElement || !bobElement) return false;
          return (
            aliceElement.x === bobElement.x &&
            aliceElement.y === bobElement.y &&
            (aliceElement.x !== beforeMove.x ||
              aliceElement.y !== beforeMove.y)
          );
        })
        .toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await stack.psql(
        "DO $proof$ BEGIN IF NOT EXISTS (SELECT 1 FROM collaboration_documents WHERE snapshot_sequence > 0) THEN RAISE EXCEPTION 'snapshot not persisted'; END IF; END $proof$;",
      );

      await stack.restartCollaborationApplication();
      await Promise.all([alice.reload(), bob.reload()]);
      await expect(alice.getByTestId("connection-status")).toHaveText(
        "Connected",
      );
      await expect(bob.getByTestId("connection-status")).toHaveText(
        "Connected",
      );

      await expect
        .poll(async () => {
          const aliceScene = (await inspect(alice)).scene;
          const bobScene = (await inspect(bob)).scene;
          return JSON.stringify(aliceScene) === JSON.stringify(bobScene)
            ? aliceScene
            : null;
        })
        .toMatchObject({
          elementCount: 1,
          elementTypes: ["rectangle"],
        });

      const publicEvidence = JSON.stringify({
        alice: await inspect(alice),
        bob: await inspect(bob),
      });
      for (const value of privateValues) {
        expect(publicEvidence).not.toContain(value);
      }
      expect(publicEvidence).not.toContain(shareUrl);
    } finally {
      await Promise.all([aliceContext.close(), bobContext.close()]);
      await browser.close();
    }
  },
);

process.stdout.write(
  "Two-client collaboration create/move/restart/reload proof passed.\n",
);
