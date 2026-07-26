import {
  expect,
  test,
} from "@playwright/test";
import {
  SYNTHETIC_ACTOR_KEYS,
} from "@vega/test-utils";
import {
  createCollaboratorContexts,
} from "@vega/test-utils/playwright";

const requiredEnvironment = (field: string): string => {
  const value = process.env[field];
  if (value === undefined || value === "") {
    throw new Error(`Required browser field ${field} is missing.`);
  }
  return value;
};

test("Alice, Bob, and Charlie load the isolated foundation shell", async ({
  browser,
}) => {
  const baseUrl = requiredEnvironment("VEGA_TEST_WEB_BASE_URL");
  const collaborators = await createCollaboratorContexts(browser, {
    baseUrl,
    runId: requiredEnvironment("VEGA_TEST_RUN_ID"),
  });
  const diagnostics: string[] = [];

  try {
    for (const key of SYNTHETIC_ACTOR_KEYS) {
      const { context, page } = collaborators[key];
      page.on("console", (message) => {
        if (message.type() === "error") {
          diagnostics.push(`${key}:console:${message.text()}`);
        }
      });
      page.on("pageerror", (error) => {
        diagnostics.push(`${key}:page:${error.message}`);
      });

      await context.addCookies([
        {
          name: "__vega_test_isolation__",
          value: key,
          url: baseUrl,
        },
      ]);
    }

    await Promise.all(
      SYNTHETIC_ACTOR_KEYS.map(async (key) => {
        await collaborators[key].page.goto("/");
      }),
    );

    for (const key of SYNTHETIC_ACTOR_KEYS) {
      const { context, page } = collaborators[key];
      await page.evaluate((value) => {
        localStorage.setItem("__vega_test_isolation__", value);
      }, key);

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "The foundation is online.",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: "Public configuration is valid",
        }),
      ).toBeVisible();
      await expect(
        page.getByText("No room or scene is created from this page."),
      ).toBeVisible();

      const localValue = await page.evaluate(() =>
        localStorage.getItem("__vega_test_isolation__"),
      );
      expect(localValue).toBe(key);
      const cookies = await context.cookies(baseUrl);
      expect(
        cookies.find(
          ({ name }) => name === "__vega_test_isolation__",
        )?.value,
      ).toBe(key);
    }

    expect(diagnostics).toEqual([]);
  } finally {
    await collaborators.close();
    await collaborators.close();
  }
});
