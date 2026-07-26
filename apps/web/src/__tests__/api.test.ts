import { apiErrorResponseSchema } from "@vega/contracts/errors";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiClientError,
  configureApiClient,
  createGuestSession,
} from "../api.js";

describe("configured API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the configured cross-origin base and credentialed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          guest: {
            id: "11111111-1111-4111-8111-111111111111",
            username: "Alice",
            colour: "#000000",
          },
          session: { expiresAt: "2026-07-27T00:00:00.000Z" },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    configureApiClient("http://127.0.0.1:4000/");

    await createGuestSession("Alice", "alice@example.test");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:4000/api/v1/guest-sessions",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("parses the shared nested safe error envelope", async () => {
    const body = {
      error: {
        code: "PERMISSION_DENIED",
        message: "Request origin is not allowed",
        requestId: "request-1",
      },
    };
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    configureApiClient("http://127.0.0.1:4000");

    await expect(
      createGuestSession("Alice", "alice@example.test"),
    ).rejects.toEqual(
      new ApiClientError(
        "Request origin is not allowed",
        "PERMISSION_DENIED",
        403,
        "request-1",
      ),
    );
  });
});
