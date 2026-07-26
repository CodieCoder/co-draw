import type { S3Client } from "@aws-sdk/client-s3";
import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";

import { DependencyLifecycle } from "./dependency-lifecycle.js";

describe("API dependency lifecycle", () => {
  it("closes the S3 client and database pool once", async () => {
    const end = vi.fn(() => Promise.resolve());
    const destroy = vi.fn();
    const pool = { end } as unknown as Pool;
    const storage = { destroy } as unknown as S3Client;
    const lifecycle = new DependencyLifecycle(pool, storage);

    await lifecycle.onApplicationShutdown();
    await lifecycle.onApplicationShutdown();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });
});
