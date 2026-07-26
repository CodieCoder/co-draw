import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { createInitialSnapshot } from "@vega/collaboration-schema";

const DEFAULT_ROOM_NAME = "Untitled Canvas";
const EXCALIDRAW_VERSION = "0.18.1";

export interface RoomRecord {
  id: string;
  name: string;
  status: string;
  created_by_guest_id: string;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface MembershipRecord {
  id: string;
  room_id: string;
  guest_id: string;
  role: string;
  created_at: Date;
}

export async function createRoom(
  client: PoolClient,
  params: { name?: string; guestId: string },
): Promise<{ roomId: string; name: string; createdAt: string }> {
  const roomId = randomUUID();
  const name = params.name?.trim() || DEFAULT_ROOM_NAME;
  const snapshot = createInitialSnapshot(EXCALIDRAW_VERSION);

  const result = await client.query<RoomRecord>(
    `INSERT INTO rooms (id, name, status, created_by_guest_id, collaboration_schema_version, excalidraw_version)
     VALUES ($1, $2, 'active', $3, 1, $4)
     RETURNING *`,
    [roomId, name, params.guestId, EXCALIDRAW_VERSION],
  );

  const room = result.rows[0];
  if (!room) throw new Error("Room creation failed");

  const membershipId = randomUUID();
  await client.query(
    `INSERT INTO room_memberships (id, room_id, guest_id, role, created_by_guest_id)
     VALUES ($1, $2, $3, 'owner', $4)`,
    [membershipId, roomId, params.guestId, params.guestId],
  );

  await client.query(
    `INSERT INTO collaboration_documents (room_id, snapshot, schema_version, excalidraw_version, snapshot_sequence)
     VALUES ($1, $2, 1, $3, 0)`,
    [roomId, Buffer.from(snapshot), EXCALIDRAW_VERSION],
  );

  return {
    roomId,
    name,
    createdAt: room.created_at.toISOString(),
  };
}

export async function getRoomWithMembership(
  client: PoolClient,
  params: { roomId: string; guestId: string },
): Promise<{
  room: RoomRecord;
  membership: MembershipRecord;
} | null> {
  const roomResult = await client.query<RoomRecord>(
    `SELECT * FROM rooms WHERE id = $1`,
    [params.roomId],
  );

  const room = roomResult.rows[0];
  if (!room) return null;

  const membershipResult = await client.query<MembershipRecord>(
    `SELECT * FROM room_memberships
     WHERE room_id = $1 AND guest_id = $2 AND revoked_at IS NULL`,
    [params.roomId, params.guestId],
  );

  const membership = membershipResult.rows[0];
  if (!membership) return null;

  return { room, membership };
}

export async function getRoomForGuest(
  client: PoolClient,
  params: { roomId: string; guestId: string },
): Promise<{ room: RoomRecord; role: string } | null> {
  const result = await client.query<RoomRecord & { role: string }>(
    `SELECT r.*, m.role
     FROM rooms r
     JOIN room_memberships m ON m.room_id = r.id
     WHERE r.id = $1 AND m.guest_id = $2 AND m.revoked_at IS NULL`,
    [params.roomId, params.guestId],
  );

  const row = result.rows[0];
  if (!row) return null;

  return { room: row, role: row.role };
}
