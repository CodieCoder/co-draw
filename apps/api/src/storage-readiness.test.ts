import type { S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { probeStorageReadiness } from "./storage-readiness.js";

const storageClient = (
  implementation: (commandName: string) => unknown,
): { client: S3Client; send: ReturnType<typeof vi.fn> } => {
  const send = vi.fn((command: object) =>
    Promise.resolve().then(() => implementation(command.constructor.name)),
  );
  return {
    client: { send } as unknown as S3Client,
    send,
  };
};

describe("object-storage readiness", () => {
  it("proves create/read/content-type/delete", async () => {
    const { client, send } = storageClient((commandName) => {
      if (commandName === "GetObjectCommand") {
        return {
          ContentType: "text/plain",
          Body: {
            transformToString: () => Promise.resolve("readiness-probe"),
          },
        };
      }
      return {};
    });

    await expect(probeStorageReadiness(client, "bucket")).resolves.toEqual({
      ready: true,
    });
    expect(send).toHaveBeenCalledTimes(4);
  });

  it("is not ready when probe cleanup fails", async () => {
    const { client } = storageClient((commandName) => {
      if (commandName === "GetObjectCommand") {
        return {
          ContentType: "text/plain",
          Body: {
            transformToString: () => Promise.resolve("readiness-probe"),
          },
        };
      }
      if (commandName === "DeleteObjectCommand") {
        throw new Error("synthetic cleanup failure");
      }
      return {};
    });

    await expect(probeStorageReadiness(client, "bucket")).resolves.toEqual({
      ready: false,
      reason: "probe_failed",
    });
  });

  it("maps inaccessible storage to a redacted unavailable result", async () => {
    const { client } = storageClient(() => {
      throw new Error("synthetic provider detail");
    });
    await expect(probeStorageReadiness(client, "bucket")).resolves.toEqual({
      ready: false,
      reason: "unavailable",
    });
  });

  it("bounds a stalled response body and still cleans up", async () => {
    vi.useFakeTimers();
    try {
      const { client, send } = storageClient((commandName) => {
        if (commandName === "GetObjectCommand") {
          return {
            ContentType: "text/plain",
            Body: {
              transformToString: () => new Promise(() => undefined),
            },
          };
        }
        return {};
      });

      const result = probeStorageReadiness(client, "bucket");
      await vi.advanceTimersByTimeAsync(5_000);
      await expect(result).resolves.toEqual({
        ready: false,
        reason: "unavailable",
      });
      expect(send).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });
});
