import type { Pool } from "@vega/database";
import { withClient } from "@vega/database";
import { encodeDocumentAsSnapshot, getStateVector } from "@vega/collaboration-schema";
import type * as Y from "yjs";

export interface SnapshotStore {
  roomId: string;
  ydoc: Y.Doc;
  schemaVersion: number;
  excalidrawVersion: string;
}

export async function loadSnapshot(
  pool: Pool,
  roomId: string,
): Promise<Uint8Array | null> {
  const result = await withClient(pool, (client) =>
    client.query<{ snapshot: Buffer }>(
      `SELECT snapshot FROM collaboration_documents WHERE room_id = $1`,
      [roomId],
    ),
  );

  const row = result.rows[0];
  if (!row) return null;

  return new Uint8Array(row.snapshot);
}

export async function persistSnapshot(
  pool: Pool,
  pending: SnapshotStore,
): Promise<void> {
  const snapshot = Buffer.from(encodeDocumentAsSnapshot(pending.ydoc));
  const stateVector = Buffer.from(getStateVector(pending.ydoc));

  await withClient(pool, (client) =>
    client.query(
      `INSERT INTO collaboration_documents (room_id, snapshot, state_vector, schema_version, excalidraw_version, snapshot_sequence, updated_at)
       VALUES ($1, $2, $3, $4, $5, 1, NOW())
       ON CONFLICT (room_id)
       DO UPDATE SET
         snapshot = $2,
         state_vector = $3,
         schema_version = $4,
         excalidraw_version = $5,
         snapshot_sequence = collaboration_documents.snapshot_sequence + 1,
         updated_at = NOW()`,
      [pending.roomId, snapshot, stateVector, pending.schemaVersion, pending.excalidrawVersion],
    ),
  );
}
