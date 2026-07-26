import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { ApiConfiguration } from "@vega/config/api";
import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

import { AppModule } from "./app.module.js";
import {
  buildClearedSessionCookie,
  buildSessionCookie,
  registerApiRequestPolicy,
} from "./http-policy.js";
import { createGuestSession } from "./session/session.service.js";
import {
  createShareLink,
  ShareLinkCreationError,
} from "./share-links/share-links.service.js";

const configuration: ApiConfiguration = {
  profile: "local",
  host: "127.0.0.1",
  port: 4_000,
  allowedWebOrigins: ["http://localhost:5173"],
  releaseId: "test",
  databaseUrl: "postgresql://api:test@127.0.0.1:5432/test",
  collaborationUrl: "ws://127.0.0.1:1234",
  collaborationSigningSecret: "test-signing-secret-with-at-least-32-bytes",
  objectStorageEndpoint: "http://127.0.0.1:9000",
  objectStorageRegion: "us-east-1",
  objectStorageBucket: "test-bucket",
  objectStorageAccessKey: "test-access",
  objectStorageSecretKey: "test-secret",
  objectStorageForcePathStyle: true,
};

describe("API remediation boundaries", () => {
  it("boots the Nest module with symbol-injected session guards", async () => {
    const application = await NestFactory.create<NestFastifyApplication>(
      AppModule.register(configuration),
      new FastifyAdapter({ logger: false }),
      { logger: false },
    );
    registerApiRequestPolicy(
      application.getHttpAdapter().getInstance(),
      configuration,
    );

    try {
      await application.init();
      const response = await application
        .getHttpAdapter()
        .getInstance()
        .inject({
          method: "POST",
          url: "/api/v1/guest-sessions",
          headers: { "content-type": "application/json" },
          payload: { username: "Alice", email: "alice@example.test" },
        });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: {
          code: "PERMISSION_DENIED",
          message: "Request origin is not allowed",
        },
      });
    } finally {
      await application.close();
    }
  });

  it("sets Secure only outside the explicit local profile", () => {
    expect(buildSessionCookie("token", configuration)).not.toContain("Secure");
    expect(
      buildSessionCookie("token", { ...configuration, profile: "demo" }),
    ).toContain("; Secure");
    expect(
      buildClearedSessionCookie({ ...configuration, profile: "production" }),
    ).toContain("; Secure");
  });

  it("always inserts a new guest instead of restoring by email", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            email_normalized: "alice@example.test",
            username: "Alice",
            colour: "#e06c75",
            created_at: new Date(),
            disabled_at: null,
          },
        ],
      })
      .mockResolvedValue({ rows: [] });
    const client = { query } as unknown as PoolClient;

    await createGuestSession(client, {
      username: "Alice",
      email: "alice@example.test",
      guestId: "11111111-1111-4111-8111-111111111111",
      sessionId: "22222222-2222-4222-8222-222222222222",
      tokenHash: "hash",
    });

    const statements = query.mock.calls.map(([sql]) => String(sql));
    expect(statements[0]).toContain("INSERT INTO guests");
    expect(statements.join("\n")).not.toContain(
      "WHERE email_normalized",
    );
  });

  it("rejects share creation before insert when the caller is not owner", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ status: "active", role: "editor" }],
    });
    const client = { query } as unknown as PoolClient;

    await expect(
      createShareLink(client, {
        roomId: "11111111-1111-4111-8111-111111111111",
        guestId: "22222222-2222-4222-8222-222222222222",
        defaultRole: "editor",
        baseUrl: "http://localhost:5173",
      }),
    ).rejects.toEqual(new ShareLinkCreationError("forbidden"));
    expect(query).toHaveBeenCalledTimes(1);
  });
});
