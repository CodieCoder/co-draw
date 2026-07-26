import { createHash } from "node:crypto";
import type { PoolClient } from "pg";

const SESSION_COOKIE = "vega_session";
const SESSION_EXPIRY_HOURS = 24;

export { SESSION_COOKIE };

export interface GuestRecord {
  id: string;
  email_normalized: string;
  username: string;
  colour: string;
  created_at: Date;
  disabled_at: Date | null;
}

export interface SessionRecord {
  id: string;
  guest_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  last_used_at: Date | null;
}

export interface ResolvedSession {
  sessionId: string;
  guest: {
    id: string;
    username: string;
    colour: string;
  };
  expiresAt: string;
}

const COLOURS = [
  "#e06c75", "#d19a66", "#e5c07b", "#98c379",
  "#56b6c2", "#61afef", "#c678dd", "#be5046",
  "#7ec8e3", "#f3a683", "#778beb", "#e77f67",
];

function pickColour(index: number): string {
  return COLOURS[index % COLOURS.length]!;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createGuestSession(
  client: PoolClient,
  params: {
    username: string;
    email: string;
    guestId: string;
    sessionId: string;
    tokenHash: string;
  },
): Promise<ResolvedSession> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 3600 * 1000);

  const colourIndex = Number.parseInt(params.guestId.slice(0, 2), 16);
  const result = await client.query<GuestRecord>(
    `INSERT INTO guests (id, email_normalized, username, colour, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [params.guestId, params.email, params.username, pickColour(colourIndex)],
  );
  const guest = result.rows[0] ?? null;
  if (!guest) {
    throw new Error("Guest creation failed");
  }

  await client.query(
    `INSERT INTO guest_sessions (id, guest_id, token_hash, expires_at, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [params.sessionId, guest.id, params.tokenHash, expiresAt],
  );

  await client.query(
    `UPDATE guests SET last_seen_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [guest.id],
  );

  return {
    sessionId: params.sessionId,
    guest: {
      id: guest.id,
      username: guest.username,
      colour: guest.colour,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

export async function resolveSession(
  client: PoolClient,
  rawToken: string,
): Promise<ResolvedSession | null> {
  const tokenHash = hashToken(rawToken);

  const result = await client.query<{
    session_id: string;
    guest_id: string;
    expires_at: Date | string;
    revoked_at: Date | string | null;
    guest_id_val: string;
    username: string;
    colour: string;
    disabled_at: Date | string | null;
  }>(
    `SELECT s.id as session_id, s.guest_id, s.expires_at, s.revoked_at,
            g.id as guest_id_val, g.username, g.colour, g.disabled_at
     FROM guest_sessions s
     JOIN guests g ON s.guest_id = g.id
     WHERE s.token_hash = $1`,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) return null;

  if (row.revoked_at || row.disabled_at) return null;

  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
  if (expiresAt <= new Date()) return null;

  await client.query(
    `UPDATE guest_sessions SET last_used_at = NOW() WHERE id = $1`,
    [row.session_id],
  );

  return {
    sessionId: row.session_id,
    guest: {
      id: row.guest_id_val,
      username: row.username,
      colour: row.colour,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeSession(client: PoolClient, sessionId: string): Promise<void> {
  await client.query(
    `UPDATE guest_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
}
