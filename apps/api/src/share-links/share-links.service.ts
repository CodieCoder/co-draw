import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { generateToken, hashToken } from "@vega/auth";

export class ShareLinkCreationError extends Error {
  constructor(
    public readonly reason: "not_found" | "archived" | "forbidden",
  ) {
    super(reason);
    this.name = "ShareLinkCreationError";
  }
}

export async function createShareLink(
  client: PoolClient,
  params: {
    roomId: string;
    guestId: string;
    defaultRole: "editor";
    expiresAt?: string;
    maxUses?: number;
    baseUrl: string;
  },
): Promise<{
  id: string;
  url: string;
  defaultRole: string;
  expiresAt?: string;
  maxUses?: number;
  createdAt: string;
}> {
  const linkId = randomUUID();
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const authority = await client.query<{ status: string; role: string | null }>(
    `SELECT r.status, m.role
     FROM rooms r
     LEFT JOIN room_memberships m
       ON m.room_id = r.id
      AND m.guest_id = $2
      AND m.revoked_at IS NULL
     WHERE r.id = $1`,
    [params.roomId, params.guestId],
  );
  const authorityRow = authority.rows[0];
  if (!authorityRow || !authorityRow.role) {
    throw new ShareLinkCreationError("not_found");
  }
  if (authorityRow.status !== "active") {
    throw new ShareLinkCreationError("archived");
  }
  if (authorityRow.role !== "owner") {
    throw new ShareLinkCreationError("forbidden");
  }

  await client.query(
    `INSERT INTO room_share_links (id, room_id, token_hash, default_role, created_by_guest_id, created_at, expires_at, max_uses)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      linkId,
      params.roomId,
      tokenHash,
      params.defaultRole,
      params.guestId,
      now,
      params.expiresAt ? new Date(params.expiresAt) : null,
      params.maxUses ?? null,
    ],
  );

  return {
    id: linkId,
    url: `${params.baseUrl}/invite/${rawToken}`,
    defaultRole: params.defaultRole,
    createdAt: now.toISOString(),
    ...(params.expiresAt ? { expiresAt: params.expiresAt } : {}),
    ...(params.maxUses !== undefined ? { maxUses: params.maxUses } : {}),
  };
}

export async function resolveShareLink(
  client: PoolClient,
  rawToken: string,
): Promise<{
  roomId: string;
  roomName: string;
  roomStatus: string;
  defaultRole: string;
} | null> {
  const tokenHash = hashToken(rawToken);

  const result = await client.query<{
    room_id: string;
    room_name: string;
    room_status: string;
    default_role: string;
    expires_at: Date | null;
    revoked_at: Date | null;
    max_uses: number | null;
    use_count: number;
  }>(
    `SELECT sl.room_id, r.name as room_name, r.status as room_status,
            sl.default_role, sl.expires_at, sl.revoked_at, sl.max_uses, sl.use_count
     FROM room_share_links sl
     JOIN rooms r ON r.id = sl.room_id
     WHERE sl.token_hash = $1`,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) return null;

  if (row.revoked_at) return null;
  if (row.room_status !== "active") return null;

  const expiresAt = row.expires_at instanceof Date ? row.expires_at : row.expires_at ? new Date(row.expires_at) : null;
  if (expiresAt && expiresAt <= new Date()) return null;

  if (row.max_uses !== null && row.use_count >= row.max_uses) return null;

  return {
    roomId: row.room_id,
    roomName: row.room_name,
    roomStatus: row.room_status,
    defaultRole: row.default_role,
  };
}

export async function acceptShareLink(
  client: PoolClient,
  params: { rawToken: string; guestId: string },
): Promise<{ roomId: string; roomName: string; role: string; roomStatus: string } | null> {
  const tokenHash = hashToken(params.rawToken);

  const linkResult = await client.query<{
    link_id: string;
    room_id: string;
    default_role: string;
    expires_at: Date | null;
    revoked_at: Date | null;
    max_uses: number | null;
    use_count: number;
  }>(
    `SELECT id as link_id, room_id, default_role, expires_at, revoked_at, max_uses, use_count
     FROM room_share_links
     WHERE token_hash = $1
     FOR UPDATE`,
    [tokenHash],
  );

  const linkRow = linkResult.rows[0];
  if (!linkRow) return null;

  if (linkRow.revoked_at) return null;

  const expiresAt = linkRow.expires_at instanceof Date ? linkRow.expires_at : linkRow.expires_at ? new Date(linkRow.expires_at) : null;
  if (expiresAt && expiresAt <= new Date()) return null;

  if (linkRow.max_uses !== null && linkRow.use_count >= linkRow.max_uses) return null;

  const roomResult = await client.query<{ name: string; status: string }>(
    `SELECT name, status FROM rooms WHERE id = $1`,
    [linkRow.room_id],
  );
  const room = roomResult.rows[0];
  if (!room || room.status !== "active") return null;

  const existingMembership = await client.query(
    `SELECT id FROM room_memberships
     WHERE room_id = $1 AND guest_id = $2 AND revoked_at IS NULL`,
    [linkRow.room_id, params.guestId],
  );

  if (existingMembership.rows.length === 0) {
    const membershipId = randomUUID();
    await client.query(
      `INSERT INTO room_memberships (id, room_id, guest_id, role, created_by_guest_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id, guest_id) DO UPDATE SET role = $4, revoked_at = NULL, updated_at = NOW()`,
      [membershipId, linkRow.room_id, params.guestId, linkRow.default_role, params.guestId],
    );
  }

  await client.query(
    `UPDATE room_share_links SET use_count = use_count + 1 WHERE id = $1`,
    [linkRow.link_id],
  );

  return {
    roomId: linkRow.room_id,
    roomName: room.name,
    role: linkRow.default_role,
    roomStatus: room.status,
  };
}
