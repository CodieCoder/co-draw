import { signCollaborationToken } from "@vega/auth";
import type { Pool } from "@vega/database";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import { authenticateConnection, parseDocumentName } from "./auth.js";
import { loadSnapshot, persistSnapshot } from "./persistence.js";

const SECRET = "test-signing-secret-with-at-least-32-bytes";
const sessionId = "11111111-1111-4111-8111-111111111111";
const guestId = "22222222-2222-4222-8222-222222222222";
const roomId = "33333333-3333-4333-8333-333333333333";

function poolWithQuery(
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>,
): Pool {
  const client = {
    query,
    release: () => undefined,
  };
  return {
    connect: () => Promise.resolve(client),
  } as unknown as Pool;
}

function token(role: "owner" | "editor" | "viewer" = "editor"): string {
  const now = Date.now();
  return signCollaborationToken(
    {
      version: 1,
      sessionId,
      guestId,
      roomId,
      role,
      mode: role === "viewer" ? "read-only" : "read-write",
      issuedAt: now,
      expiresAt: now + 300_000,
    },
    SECRET,
  );
}

describe("collaboration remediation boundaries", () => {
  it("accepts only strict room UUID document names", () => {
    expect(parseDocumentName(`room:${roomId}`)).toBe(roomId);
    expect(parseDocumentName("room:not-a-uuid")).toBeNull();
    expect(parseDocumentName(`other:${roomId}`)).toBeNull();
  });

  it("derives current viewer read-only authority from the database", async () => {
    let call = 0;
    const pool = poolWithQuery(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({
          rows: [{
            guest_id: guestId,
            expires_at: new Date(Date.now() + 60_000),
            revoked_at: null,
            disabled_at: null,
          }],
        });
      }
      return Promise.resolve({
        rows: [{ role: "viewer", status: "active" }],
      });
    });

    const result = await authenticateConnection(
      pool,
      SECRET,
      `room:${roomId}`,
      token("editor"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.role).toBe("viewer");
      expect(result.claims.mode).toBe("read-only");
    }
  });

  it("rejects an expired live session even when the signed token is valid", async () => {
    const pool = poolWithQuery(() => Promise.resolve({
      rows: [{
        guest_id: guestId,
        expires_at: new Date(Date.now() - 1),
        revoked_at: null,
        disabled_at: null,
      }],
    }));

    await expect(
      authenticateConnection(
        pool,
        SECRET,
        `room:${roomId}`,
        token(),
      ),
    ).resolves.toMatchObject({
      ok: false,
      code: "COLLAB_SESSION_INVALID",
    });
  });

  it("returns null for a missing document and awaits an encoded snapshot store", async () => {
    const calls: Array<{ text: string; values?: unknown[] }> = [];
    const pool = poolWithQuery((text, values) => {
      calls.push(values ? { text, values } : { text });
      return Promise.resolve({ rows: [] });
    });

    await expect(loadSnapshot(pool, roomId)).resolves.toBeNull();

    const ydoc = new Y.Doc();
    ydoc.getMap("elements").set("r1", { id: "r1", type: "rectangle" });
    await persistSnapshot(pool, {
      roomId,
      ydoc,
      schemaVersion: 1,
      excalidrawVersion: "0.18.1",
    });

    expect(calls[1]?.text).toContain("snapshot_sequence + 1");
    expect(calls[1]?.values?.[1]).toBeInstanceOf(Buffer);
    expect(calls[1]?.values?.[2]).toBeInstanceOf(Buffer);
  });
});
