import { describe, expect, it } from "vitest";

const requiredEnvironment = (field: string): string => {
  const value = process.env[field];
  if (value === undefined || value === "") {
    throw new Error(`Required integration field ${field} is missing.`);
  }
  return value;
};

const apiBaseUrl = requiredEnvironment("VEGA_TEST_API_BASE_URL");
const collaborationBaseUrl = requiredEnvironment(
  "VEGA_TEST_COLLABORATION_BASE_URL",
);
const releaseId = requiredEnvironment("VEGA_TEST_RELEASE_ID");

const expectExactResponse = async (
  url: string,
  status: number,
  body: object,
): Promise<void> => {
  const response = await fetch(url);
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual(body);
};

describe("isolated Stage 0 services", () => {
  it("serves exact health contracts without exposing domain routes", async () => {
    await Promise.all([
      expectExactResponse(`${apiBaseUrl}/health/live`, 200, {
        service: "api",
        state: "live",
        releaseId,
      }),
      expectExactResponse(`${apiBaseUrl}/health/ready`, 200, {
        service: "api",
        state: "ready",
        releaseId,
      }),
      expectExactResponse(`${collaborationBaseUrl}/health/live`, 200, {
        service: "collaboration",
        state: "live",
        releaseId,
      }),
      expectExactResponse(`${collaborationBaseUrl}/health/ready`, 200, {
        service: "collaboration",
        state: "ready",
        releaseId,
      }),
    ]);

    const [apiRoute, collaborationRoute] = await Promise.all([
      fetch(`${apiBaseUrl}/api/v1/rooms`),
      fetch(`${collaborationBaseUrl}/rooms`),
    ]);
    expect(apiRoute.status).toBe(404);
    expect(collaborationRoute.status).toBe(404);
  });
});
